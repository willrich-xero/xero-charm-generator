const PORTKEY_BASE = 'http://llm-gateway.xgw.xero-test.com/v1'
const MODEL = '@bedrock/global.anthropic.claude-sonnet-4-6'

const CHARM_SLUGS = [
  "alarm-bell", "battery-low", "beach-chair", "broken-chain",
  "calendar-cross", "calendar-tick", "cash-note", "chain",
  "chart-growth", "chart-pie", "click-hand", "clock-melt",
  "clock", "cocktail-glass", "coconut-drink", "coffee-mug",
  "coins-face", "coins", "flame", "hourglass", "light-bulb",
  "lock", "meter", "paper-plane", "paperwork", "percent",
  "relationship-heart", "sparkle", "speech-bubbles", "stopwatch",
  "tax-weight", "thumbs-up", "tick"
]

function buildEnhancePrompt(subject) {
  return `You are a prompt engineer for a charm icon generator.

The user will give you a simple object name. You must respond with ONLY a valid JSON object, no other text, no markdown, no backticks.

The JSON must have exactly three fields:
- "enhanced": a 1-2 sentence description of the object for an icon generator. Describe key visual details. Always end with "No ground shadow."
- "colour": exactly one of these values: Auto blue, Gold, Coral, Mint, Purple, Orange
- "charm": the single most visually similar charm slug from this list, chosen based on shape and form similarity: ${CHARM_SLUGS.join(", ")}

Colour guide:
- Gold: coins, money, trophies, stars, bells
- Coral: hearts, piggy banks, emotion, leisure, relationships
- Mint: plants, growth, nature, success, money notes
- Purple: magic, creativity, percentage signs
- Orange: fire, flames — only if the object involves literal fire
- Auto blue: everything else

Charm matching guide — pick the charm whose SHAPE is most similar:
- Round objects → coins, percent, chart-pie
- Tall cylindrical → coffee-mug, cocktail-glass, coconut-drink
- Rectangular flat → calendar-tick, calendar-cross, paperwork, cash-note
- Time-related → clock, stopwatch, hourglass, clock-melt
- Small icon/symbol → tick, sparkle, thumbs-up, click-hand
- Chain/connection → chain, broken-chain
- Finance/money → coins, cash-note, tax-weight, chart-growth
- Alert/notification → alarm-bell, light-bulb
- Nature/leisure → beach-chair, coconut-drink, flame

Input: ${subject}`
}

async function callPortkey(prompt) {
  if (!process.env.PORTKEY_API_KEY) throw new Error('PORTKEY_API_KEY not configured')

  const res = await fetch(`${PORTKEY_BASE}/messages`, {
    method: 'POST',
    headers: {
      'x-portkey-api-key': process.env.PORTKEY_API_KEY,
      'x-portkey-provider': 'bedrock',
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('Portkey error:', JSON.stringify(err))
    throw new Error(err.error?.message || `Portkey error: ${res.status}`)
  }

  const data = await res.json()
  return data.content[0].text
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { subject } = req.body
  if (!subject?.trim()) return res.status(400).json({ error: 'Subject is required' })

  // Gracefully handle missing Portkey key — enhance just won't work on deployed version
  if (!process.env.PORTKEY_API_KEY) {
    return res.status(503).json({ error: 'Enhancement not available in this environment' })
  }

  try {
    const prompt = buildEnhancePrompt(subject.trim())
    console.log('Sending to Portkey:', subject)

    const text = await callPortkey(prompt)
    console.log('Portkey response:', text)

    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (!parsed.enhanced || !parsed.colour) {
      throw new Error('Invalid response format: ' + JSON.stringify(parsed))
    }

    return res.status(200).json({
      enhanced: parsed.enhanced,
      colour: parsed.colour,
      charm: parsed.charm || null,
      prompt,
    })
  } catch (err) {
    console.error('Enhance error:', err.message)
    return res.status(500).json({ error: err.message || 'Enhancement failed' })
  }
}

export const config = {
  api: { responseLimit: false },
  maxDuration: 60,
}
