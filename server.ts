import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { analyzeIssue, chatbotResponse, analyzeFix, generateSummary } from './server/gemini';
import { adminDb } from './server/firebaseAdmin';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' })); // for base64 images

  app.post('/api/analyze-issue', analyzeIssue);
  app.post('/api/chatbot', chatbotResponse);
  app.post('/api/analyze-fix', analyzeFix);
  app.post('/api/generate-summary', generateSummary);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
