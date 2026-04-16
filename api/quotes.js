import { createClient } from 'redis';

// Создаем клиент, используя твою переменную с redis://
const client = createClient({
  url: process.env.KV_URL_REDIS_URL
});

client.on('error', err => console.error('Redis Client Error', err));

// Подключаемся один раз при запуске функции
await client.connect();

const QUOTES_KEY = 'golden_quotes';

export default async function handler(req, res) {
  // Настройки CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const data = await client.get(QUOTES_KEY);
      const quotes = data ? JSON.parse(data) : [];
      return res.status(200).json(quotes);
    }

    if (req.method === 'POST') {
      const { text, author, story } = req.body;
      
      if (!text || text.length < 5) return res.status(400).json({ error: 'Слишком коротко' });

      const data = await client.get(QUOTES_KEY);
      const quotes = data ? JSON.parse(data) : [];

      const newQuote = {
        id: Date.now(),
        text: text.trim(),
        author: author.trim() || 'Аноним',
        story: story ? story.trim() : '',
        date: new Date().toISOString().split('T')[0],
      };

      quotes.push(newQuote);
      // Сохраняем обратно как строку JSON
      await client.set(QUOTES_KEY, JSON.stringify(quotes));
      
      return res.status(201).json(newQuote);
    }
  } catch (err) {
    console.error("Ошибка базы:", err);
    return res.status(500).json({ error: "Ошибка базы данных" });
  }
}