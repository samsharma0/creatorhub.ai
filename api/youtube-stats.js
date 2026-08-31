// This file runs on the SERVER (Vercel), never in the browser.
// Fetches real view/like/comment counts for a public YouTube video.

function extractYouTubeId(url) {
  // Handles youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtu\.be\/)([^?&\s]+)/,
    /(?:youtube\.com\/shorts\/)([^?&\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Missing url' });
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'Could not extract a YouTube video ID from this link' });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoId}&key=${apiKey}`
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return res.status(404).json({ error: 'Video not found. It may be private, deleted, or the link is invalid.' });
    }

    const video = data.items[0];
    const stats = video.statistics;
    const snippet = video.snippet;

    return res.status(200).json({
      title: snippet.title,
      channelTitle: snippet.channelTitle,
      views: stats.viewCount || '0',
      likes: stats.likeCount || 'Hidden by creator',
      comments: stats.commentCount || '0',
    });
  } catch (err) {
    console.error('YouTube stats API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
