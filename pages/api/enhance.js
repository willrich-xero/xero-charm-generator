const PORTKEY_BASE = 'https://api.portkey.ai/v1'
const MODEL = 'claude-sonnet-4-6'

async function callClaude(systemPrompt, userMessage) {
  if (!process.env.PORTKEY_API_KEY) throw new Error('PORTKEY_API_KEY not configured')

  const res = await fetch(`${PORTKEY_BASE}/messages`, {
    method: 'POST',
    headers: {
      'x-portkey-api-key': process.env.PORTKEY_API_KEY,
      'x-portkey-provider': 'anthropic',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Portkey error: ${res.status}`)
  }

  const data = await res.json()
  return data.content[0].text
}

const COLOUR_OPTIONS = ['Auto blue', 'Gold', 'Coral', 'Mint', 'Purple', 'Orange']

const ENHANCE_SYSTEM = `You are a prompt engineer for Xero's brand charm icon generator.
Your job is to take a simple object description and expand it into a clear, specific subject description for an AI image generator.

Rules:
- Keep it to 1-2 sentences maximum
- Describe the object's key visual details (shape, any defining features)
- Always end with "No ground shadow."
- Do NOT mention colours — colour is handled separately
- Do NOT mention style, rendering, or background
- Be specific about defining features but don't overcomplicate
- Output ONLY the enhanced description, nothing else

Examples:
Input: "piggy bank"
Output: "A chubby piggy bank with a coin slot on top, four small stubby legs, and a simple snout. No ground shadow."

Input: "alarm clock"
Output: "A round alarm clock with two bells on top and a small button between them, viewed from a slight angle. No ground shadow."

Input: "coffee mug"
Output: "A wide, chunky coffee mug with a generous handle and a gentle wisp of steam rising from the top. No ground shadow."`

const COLOUR_SYSTEM = `You are a colour advisor for Xero's brand charm icon generator.
Given a simple object description, recommend the single best colour option from the Xero brand palette.

The colour options and their best uses are:
- Auto blue: objects with no strong real-world colour (ceramic, wood, concrete, glass, metal)
- Gold: coins, money, stars, trophies, bells, premium or financial elements
- Coral: hearts, alerts, emotion, leisure, relationships, warmth, flamingos
- Mint: success, growth, nature, plants, money notes, eco themes
- Purple: magic, creativity, percentage, abstract concepts
- Orange: fire, flames, energy, urgency — only if the object literally involves fire or heat

Rules:
- Output ONLY the colour name exactly as written above, nothing else
- If genuinely unsure between two, pick Auto blue as the safe default
- A piggy bank → Coral (pink pig)
- A candle → Auto blue (wax has no palette match, flame handled separately)
- A coin → Gold
- A plant → Mint
- A magic wand → Purple`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { subject, mode } = req.body

  if (!subject?.trim()) return res.status(400).json({ error: 'Subject is required' })

  try {
    if (mode === 'enhance') {
      const enhanced = await callClaude(ENHANCE_SYSTEM, subject)
      return res.status(200).json({ enhanced: enhanced.trim() })
    }

    if (mode === 'colour') {
      const colour = await callClaude(COLOUR_SYSTEM, subject)
      const matched = COLOUR_OPTIONS.find(c =>
        c.toLowerCase() === colour.trim().toLowerCase()
      )
      return res.status(200).json({ colour: matched || 'Auto blue' })
    }

    // Do both at once
    const [enhanced, colour] = await Promise.all([
      callClaude(ENHANCE_SYSTEM, subject),
      callClaude(COLOUR_SYSTEM, subject),
    ])

    const matched = COLOUR_OPTIONS.find(c =>
      c.toLowerCase() === colour.trim().toLowerCase()
    )

    return res.status(200).json({
      enhanced: enhanced.trim(),
      colour: matched || 'Auto blue',
    })
  } catch (err) {
    console.error('Enhance error:', err)
    return res.status(500).json({ error: err.message || 'Enhancement failed' })
  }
}
