import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
    response.status(200).json({
        name: 'chat-seia-notifications-api',
        health: '/health',
        notifications: 'POST /notifications/messages',
    });
});

healthRouter.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
});
