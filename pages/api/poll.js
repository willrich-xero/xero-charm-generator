const FLORA_BASE = 'https://app.flora.ai'
const TECHNIQUE_SLUG = 'will-charm-generator-test'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { runId } = req.query
  if (!runId) return res.status(400).json({ error: 'runId is required' })
  if (!process.env.FLORA_API_KEY) return res.status(500).json({ error: 'API key not configured' })

  try {
    const pollRes = await fetch(
      `${FLORA_BASE}/api/v1/techniques/${TECHNIQUE_SLUG}/runs/${runId}`,
      { headers: { Authorization: `Bearer ${process.env.FLORA_API_KEY}` } }
    )

    const text = await pollRes.text()
    let data
    try { data = JSON.parse(text) } catch {
      return res.status(500).json({ error: 'Invalid response from Flora' })
    }

    if (!pollRes.ok) {
      return res.status(pollRes.status).json({ error: data.error?.message || 'Poll failed' })
    }

    if (data.status === 'completed') {
      const images = ['image', 'image-2', 'image-3', 'image-4']
        .map(id => data.outputs.find(o => o.outputId === id)?.url)
        .filter(Boolean)
      return res.status(200).json({ status: 'completed', images })
    }

    if (data.status === 'failed') {
      return res.status(200).json({ status: 'failed', error: data.errorMessage || 'Generation failed' })
    }

    // Still running — return status and progress
    return res.status(200).json({ status: data.status, progress: data.progress || 0 })
  } catch (err) {
    console.error('Poll error:', err)
    return res.status(500).json({ error: err.message || 'Poll failed' })
  }
}
