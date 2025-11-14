import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';

const app: Express = express();
const PORT = process.env.PORT ?? 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api', (_req: Request, res: Response): void => {
  res.json({ message: 'Welcome to Modelia API' });
});

app.listen(PORT, (): void => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

