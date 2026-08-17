// This file runs on the SERVER (Vercel), never in the browser.
// Your API key stays safe here and is never exposed to users.

export default async function handler(req, res) {
  // Allow requests only via POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic CORS handling (safe to keep permissive for your own frontend)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { prompt, max_tokens } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY, // <-- comes from Vercel env variable, NEVER hardcode
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929', // adjust if your account uses a different model string
        max_tokens: max_tokens || 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    return res.status(200).json({ text });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
