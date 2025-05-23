import express from 'express';
import { google, youtube_v3 } from 'googleapis';

const router = express.Router();

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      console.error('YouTube API key is not configured');
      return res.status(500).json({ error: 'YouTube API is not configured' });
    }

    console.log('Searching YouTube for:', q);
    const response = await youtube.search.list({
      part: ['snippet'],
      q: q as string,
      type: ['video'],
      maxResults: 1,
      videoEmbeddable: 'true'
    } as youtube_v3.Params$Resource$Search$List);

    console.log('YouTube API response:', JSON.stringify(response.data, null, 2));

    const videoId = response.data?.items?.[0]?.id?.videoId;

    if (!videoId) {
      console.log('No video found for query:', q);
      return res.status(404).json({ error: 'No video found' });
    }

    console.log('Found video ID:', videoId);
    res.json({ videoId });
  } catch (error) {
    console.error('YouTube search error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      query: req.query.q
    });
    res.status(500).json({ 
      error: 'Failed to search YouTube',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 