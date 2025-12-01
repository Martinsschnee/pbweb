const { getStore } = require('@netlify/blobs');
const { SITE_ID } = require('./utils/config.cjs');
const { getUser } = require('./utils/auth.cjs');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const user = getUser(event);
    if (!user || user.role !== 'admin') {
        return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    try {
        const store = getStore({
            name: 'stats',
            siteID: SITE_ID,
            token: process.env.BLOB_AUTH_TOKEN,
        });

        const logs = await store.get('recent_logs', { type: 'json' }) || [];

        return {
            statusCode: 200,
            body: JSON.stringify({ logs })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
