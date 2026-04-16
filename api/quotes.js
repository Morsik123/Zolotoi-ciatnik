// api/quotes.js — Vercel Serverless Function
// Хранилище: Vercel KV (Redis) через @vercel/kv

import { createClient } from '@vercel/kv';

const kv = createClient({
  url: process.env.KV_URL_REDIS_URL,
});

const QUOTES_KEY = 'golden_quotes';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const quotes = await kv.get(QUOTES_KEY) || [];
      return res.status(200).json(quotes);
    } catch (err) {
      console.error('GET error:', err);
      return res.status(500).json({ error: 'Не удалось загрузить цитаты' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { text, author, story } = req.body;

      // Validation
      if (!text || text.trim().length < 5) {
        return res.status(400).json({ error: 'Цитата слишком короткая' });
      }
      if (!author || author.trim().length < 1) {
        return res.status(400).json({ error: 'Укажите имя' });
      }
      if (text.length > 500 || author.length > 80) {
        return res.status(400).json({ error: 'Текст слишком длинный' });
      }

      // Load existing
      const quotes = await kv.get(QUOTES_KEY) || [];

      const newQuote = {
        id:     Date.now(),
        text:   text.trim().slice(0, 500),
        author: author.trim().slice(0, 80),
        story:  story ? story.trim().slice(0, 300) : '',
        date:   new Date().toISOString().split('T')[0],
      };

      quotes.push(newQuote);
      await kv.set(QUOTES_KEY, quotes);

      return res.status(201).json(newQuote);
    } catch (err) {
      console.error('POST error:', err);
      return res.status(500).json({ error: 'Не удалось сохранить цитату' });
    }
  }

  return res.status(405).json({ error: 'Метод не поддерживается' });
}
