import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini if key available
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI();
}

// Endpoint to parse natural voice commands and hands-free requests
app.post('/api/voice-intent', async (req, res) => {
  const { query, availableTracks = [] } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Fallback if no Gemini AI configured
  if (!ai || !apiKey) {
    return res.json({
      fallback: true,
      message: 'Processing with local offline matcher',
      action: 'smart_match',
      query,
    });
  }

  try {
    const trackSummaries = availableTracks.slice(0, 40).map((t: any) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      category: t.category,
      tags: t.tags || [],
    }));

    const prompt = `You are the voice assistant for Kadosh Motion, a Christian Music & Sermon player.
User spoken command: "${query}"

Here are available tracks/sermons:
${JSON.stringify(trackSummaries, null, 2)}

Categories supported:
- dancing_stars (Dancing Stars Songs, energetic praise/choreography)
- prayer_chants (Prayer Songs or Chants, warfare, tongues, atmosphere)
- worship (Worship Songs, intimate adoration)
- praises (Praises Songs, joyful celebration)
- preaching (Preaching Messages by Bishop Dag Heward-Mills & Bishop Joshua Heward-Mills)
- camp_messages (Camp Messages: Anagkazo, Machaneh, Iron Sharpens Iron, Healing Jesus)

Understand the user's intent:
1. If they mention a song or sermon title, artist (e.g. Bishop Dag, Bishop Joshua, Dancing Stars), or genre ("play some worship", "give me a prayer chant"), identify the best matching track id or category.
2. If they say "play [song name]", find that specific song.
3. If they say "stop" or "pause", action is "pause".
4. If they say "next" or "skip", action is "next".
5. If they say "previous", action is "prev".
6. If they say "set sleep timer to X minutes" or "sleep in 20 min", action is "timer" and timerMinutes: X.
7. If they say "turn on battery saver", action is "low_battery".

Respond ONLY with valid JSON with this exact schema (no markdown fences, just pure JSON):
{
  "action": "play" | "pause" | "next" | "prev" | "timer" | "switch_category" | "low_battery" | "unknown",
  "matchedTrackId": "string or null",
  "matchedCategory": "string or null",
  "timerMinutes": number or null,
  "spokenFeedback": "Short uplifting 1-sentence confirmation to speak back to the user (e.g., 'Playing Dancing Stars victory praise for you', 'Setting sleep timer for 30 minutes')"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err: any) {
    console.error('Error in voice-intent:', err);
    return res.json({
      fallback: true,
      error: err.message,
      action: 'smart_match',
      query,
    });
  }
});

// Endpoint to provide spiritual message recommendation or devotional thought
app.post('/api/spiritual-insight', async (req, res) => {
  const { currentTrackTitle, artist, category } = req.body;
  if (!ai || !apiKey) {
    return res.json({
      insight: 'Let this word and song minister grace and peace to your spirit today.',
      scripture: 'Colossians 3:16 - Let the word of Christ dwell in you richly in all wisdom; teaching and admonishing one another in psalms and hymns and spiritual songs.',
    });
  }

  try {
    const prompt = `The user is listening to: "${currentTrackTitle}" by "${artist}" in category "${category}".
Provide a 2-sentence encouraging spiritual insight and a relevant scripture reference (Book Chapter:Verse and text) that deepens the listening experience for Bishop Dag Heward-Mills / Bishop Joshua Heward-Mills teachings or Christian praise and worship.
Return JSON:
{
  "insight": "inspiring 2 sentences",
  "scripture": "Book Chapter:Verse - scripture text"
}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    return res.json({
      insight: 'Keep your heart open to the Holy Spirit as you listen.',
      scripture: 'Psalm 100:2 - Serve the Lord with gladness: come before his presence with singing.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kadosh Motion Music Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
