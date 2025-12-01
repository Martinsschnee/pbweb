const { getStore } = require('@netlify/blobs');
const { SITE_ID } = require('./config.cjs');

async function logAction(action, user, event) {
    try {
        const store = getStore({
            name: 'stats',
            siteID: SITE_ID,
            token: process.env.BLOB_AUTH_TOKEN,
        });

        const ip = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
        const userAgent = event.headers['user-agent'] || 'unknown';

        const logEntry = {
            id: Date.now().toString(),
            action,
            username: user ? user.username : 'anonymous',
            userId: user ? user.id : null,
            ip,
            userAgent,
            timestamp: new Date().toISOString()
        };

        // We can store logs as a list in a single blob for simplicity, or separate blobs by date.
        // For this scale, a single list 'recent_logs' capped at say 1000 entries is fine.
        const logs = await store.get('recent_logs', { type: 'json' }) || [];
        logs.unshift(logEntry);

        // Keep only last 1000 logs
        if (logs.length > 1000) {
            logs.length = 1000;
        }

        await store.setJSON('recent_logs', logs);
    } catch (error) {
        console.error('Failed to log action', error);
    }
}

module.exports = { logAction };
