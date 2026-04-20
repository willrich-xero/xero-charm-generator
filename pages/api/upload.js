export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
    return res.status(500).json({ error: 'ImageKit not configured' })
  }

  try {
    // Read raw body
    const chunks = []
    for await (const chunk of req) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Convert to base64 for ImageKit upload API
    const base64 = buffer.toString('base64')
    const filename = `charm-reference-${Date.now()}.png`

    // ImageKit upload API — private key used as basic auth password
    const credentials = Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString('base64')

    const formData = new URLSearchParams()
    formData.append('file', `data:image/png;base64,${base64}`)
    formData.append('fileName', filename)
    formData.append('folder', '/charm-references')
    formData.append('useUniqueFileName', 'true')

    const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!uploadRes.ok) {
      const err = await uploadRes.json()
      throw new Error(err.message || 'ImageKit upload failed')
    }

    const data = await uploadRes.json()

    return res.status(200).json({ url: data.url })
  } catch (err) {
    console.error('Upload error:', err)
    return res.status(500).json({ error: err.message || 'Upload failed' })
  }
}
