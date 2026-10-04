import cors from 'cors';
import express from 'express';
import { healthRouter } from './routes/health';
import { notificationsRouter } from './routes/notifications';

const app = express();

app.use(cors());
app.use(express.json());
app.use(healthRouter);
app.use(notificationsRouter);

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
    console.log(`Notifications API listening on port ${port}`);
});
