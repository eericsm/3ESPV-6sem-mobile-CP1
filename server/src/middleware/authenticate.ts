import type { NextFunction, Request, Response } from 'express';
import { auth } from '../services/firebaseAdmin';

export type AuthenticatedRequest = Request & {
    userId?: string;
};

export const authenticate = async (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    const authorizationHeader = request.headers.authorization ?? '';
    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        response.status(401).json({ error: 'Token de autenticação ausente' });
        return;
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        request.userId = decodedToken.uid;
        next();
    } catch {
        response.status(401).json({ error: 'Token de autenticação inválido' });
    }
};
