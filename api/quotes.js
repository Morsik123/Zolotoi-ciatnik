import { createClient } from '@vercel/kv';

export default async function handler(req, res) {
  // 1. Проверяем наличие переменных прямо в коде
  const url = process.env.KV_URL_REDIS_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: "Конфигурация базы данных не найдена" });
  }

  const kv = createClient({ url, token });
  const QUOTES_KEY = 'golden_quotes';

  // 2. Настройка заголовков
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const quotes = await kv.get(QUOTES_KEY) || [];
      return res.status(200).json(quotes);
    }

    if (req.method === 'POST') {
      const { text, author, story } = req.body;
      
      if (!text || text.length < 5) return res.status(400).json({ error: 'Слишком коротко' });

      const quotes = await kv.get(QUOTES_KEY) || [];
      const newQuote = {
        id: Date.now(),
        text: text.trim(),
        author: author.trim() || 'Аноним',
        story: story ? story.trim() : '',
        date: new Date().toISOString().split('T')[0],
      };

      quotes.push(newQuote);
      await kv.set(QUOTES_KEY, quotes);
      return res.status(201).json(newQuote);
    }
  } catch (err) {
    console.error("Ошибка API:", err);
    return res.status(500).json({ error: err.message });
  }
}