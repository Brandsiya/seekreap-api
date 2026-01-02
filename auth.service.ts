import { Request, Response, NextFunction } from 'express';

export class AuthService {
    private validApiKeys: Set<string>;
    
    constructor() {
        // In production, store these in database or environment variables
        this.validApiKeys = new Set([
            process.env.API_KEY || 'dev_key_12345',
            'test_key_67890'
        ]);
    }
    
    validateApiKey(req: Request, res: Response, next: NextFunction) {
        const apiKey = req.headers['x-api-key'] || req.query.apiKey;
        
        if (!apiKey) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'API key is required',
                hint: 'Add header: X-API-Key: your_key'
            });
        }
        
        if (!this.validApiKeys.has(apiKey as string)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Invalid API key'
            });
        }
        
        next();
    }
    
    // Generate a new API key (for admin use)
    generateApiKey(prefix: string = 'key'): string {
        const random = Math.random().toString(36).substring(2, 15) +
                      Math.random().toString(36).substring(2, 15);
        return `${prefix}_${random}`;
    }
}

export const authService = new AuthService();
