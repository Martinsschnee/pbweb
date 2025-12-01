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
            name: 'users',
            siteID: SITE_ID,
            token: process.env.BLOB_AUTH_TOKEN,
        });

        const users = await store.get('all_users', { type: 'json' }) || [];

        // Return users without sensitive data
        const safeUsers = users.map(u => ({
            id: u.id,
            username: u.username,
            role: u.role,
            createdAt: u.createdAt
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({ users: safeUsers })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
