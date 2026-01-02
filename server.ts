import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'SeekReap API'
    });
});

app.get('/dashboard/stats', (req, res) => {
    res.json({
        summary: {
            totalEngagements: 0,
            totalEvents: 0,
            avgEventsPerEngagement: 0
        }
    });
});

app.post('/engagements', (req, res) => {
    res.json({
        success: true,
        engagementId: `eng_${Date.now()}`,
        userId: req.body.userId || 'unknown',
        createdAt: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
