const FLORA_BASE = 'https://app.flora.ai'
const TECHNIQUE_SLUG = 'will-charm-generator-test'

function buildPrompt({ subject, colourOption, colourDetail }) {
  const colourBlock = buildColourBlock(colourOption, colourDetail)

  return `STYLE REFERENCE:
You are generating a Xero brand charm icon. Study the following style rules carefully and apply them precisely.

SUBJECT: ${subject}

---

${colourBlock}

---

RENDERING STYLE:
- Flat vector illustration with genuine 3D volume — forms have weight, depth and solidity
- Bold, rounded, chunky shapes with clean immediately-readable silhouettes
- CORNERS AND EDGES: all forms must have generously rounded corners — not sharp edges. Cylindrical objects must have a clearly rounded top edge, almost pill-like. Rectangular objects have large corner radii. When in doubt, round more than feels natural — Xero charms are never hard-edged
- Base shapes flat-filled. Curved surfaces may have a lighter highlight zone to suggest roundness
- Darker tonal shadow on receding faces — deeper shade of object colour, not black
- No photorealism, no complex textures, no fine surface detail
- Steam or smoke: single elegant wispy curl only — not multiple swirls
- Overlap separation: light outlines only where shapes meet — not as global outline
- No ground shadow plane beneath the object. If subtle grounding is needed, use only the faintest hint — never a solid ellipse
- Feeling: EXPRESSIVE and CONFIDENT — the object has personality and presence

---

COMPOSITION:
- Square canvas 400x400px, background deep midnight navy #000856
- Single object: 60-70% of canvas. Multi-object: 65-75%
- Centred with slight upward optical offset
- Empty space is intentional — do not fill
- Sparkles: only if meaningful. Max 2-3, small, asymmetric, white or gold only. If in doubt, omit
- No text unless physically part of the object
- Do not crop at canvas edges

---

AVOID:
- Reproducing any specific existing charm — generate a NEW object entirely
- Real-world object colours outside the Xero palette (no browns, creams, greys, blacks, whites as fills)
- Hard or sharp edges — all forms must be generously rounded
- Heavy elliptical drop shadow or ground shadow pooling beneath the object
- Photorealistic rendering or complex textures
- Thin or stroke-only forms — solidly filled and chunky
- Neon or oversaturated colours
- Gradient-heavy fills
- Multiple steam/smoke swirls
- Coloured steam — always white
- Sparkles on every charm — only where earned
- Busy or cluttered compositions
- Generic emoji, iOS or Material Design icon style
- Human figures — objects only
- Puffy over-inflated cartoon forms
- Global white outlines — use only at shape overlap points`
}

function buildColourBlock(option, detail) {
  if (option === 'A') {
    return `COLOUR FOR THIS CHARM: Strong real-world colour match to Xero palette
Use: ${detail}

COLOUR RULES:
- 1 dominant colour + max 1-2 supporting accents
- Shadow/depth: darker shade of dominant colour — never black
  Blues → #1F65D6 / Coral → #F14B6A / Gold → #E99000 / Mint → #2DB879
- Highlights on curved surfaces: lighter tint — Blues use #3ECCFF as highlight only, never base fill
- Steam, smoke, wisps: white #FFFFFF only — never coloured
- Sparkle accents: white #FFFFFF or gold #FDCC08 only
- Never use: brown, grey, black fills, desaturated tones, or colours outside the Xero palette`
  }

  if (option === 'C') {
    return `COLOUR FOR THIS CHARM: Specific Xero accent colour
Use: ${detail}

COLOUR RULES:
- 1 dominant colour + max 1-2 supporting accents
- Shadow/depth: darker shade of dominant colour — never black
  Blues → #1F65D6 / Coral → #F14B6A / Gold → #E99000 / Mint → #2DB879
- Highlights on curved surfaces: lighter tint of dominant colour
- Steam, smoke, wisps: white #FFFFFF only — never coloured
- Sparkle accents: white #FFFFFF or gold #FDCC08 only
- Never use: brown, grey, black fills, desaturated tones, or colours outside the Xero palette`
  }

  return `COLOUR FOR THIS CHARM: This object's real-world colour does not exist in the Xero palette.
Use Xero mid-blue #4A9FD4 as the dominant colour regardless of the object's real-world colour.
Example: a coffee mug or candle — render in Xero mid-blue #4A9FD4, not cream, white or brown.

COLOUR RULES:
- Dominant: Xero mid-blue #4A9FD4
- Shadow/depth: #1F65D6 (XUI Blue) on receding faces
- Highlights: #3ECCFF as highlight only on curved surfaces — never as base fill
- Supporting accent (max 1): choose the most natural Xero accent for the subject if needed
  Coral #FF719B / Gold #FDCC08 / Mint #6AEAAA
- Steam, smoke, wisps: white #FFFFFF only — never coloured
- Sparkle accents: white #FFFFFF or gold #FDCC08 only
- Never use: brown, grey, black fills, desaturated tones, or any colour outside the Xero palette`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { subject, colourOption, colourDetail, referenceImageUrl } = req.body

  if (!subject?.trim()) return res.status(400).json({ error: 'Subject is required' })
  if (!referenceImageUrl) return res.status(400).json({ error: 'Reference image is required' })
  if (!process.env.FLORA_API_KEY) return res.status(500).json({ error: 'API key not configured' })

  try {
    const prompt = buildPrompt({ subject, colourOption: colourOption || 'B', colourDetail })

    const inputs = [
      { id: 'text-prompt', type: 'text', value: prompt },
      { id: 'coin-illustration', type: 'imageUrl', value: referenceImageUrl },
    ]

    const createRes = await fetch(`${FLORA_BASE}/api/v1/techniques/${TECHNIQUE_SLUG}/runs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FLORA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs, mode: 'async' }),
    })

    const text = await createRes.text()
    let run
    try { run = JSON.parse(text) } catch {
      throw new Error('Flora returned invalid response: ' + text.slice(0, 100))
    }

    if (!createRes.ok) {
      throw new Error(run.error?.message || 'Failed to create run')
    }

    // Return runId immediately — client will poll
    return res.status(200).json({ runId: run.runId, prompt })
  } catch (err) {
    console.error('Generate error:', err)
    return res.status(500).json({ error: err.message || 'Something went wrong' })
  }
}

export const config = {
  api: { responseLimit: false },
}
