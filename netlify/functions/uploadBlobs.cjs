const { getStore } = require('@netlify/blobs');
const { verifyToken } = require('./utils/auth.cjs');
const { SITE_ID } = require('./utils/config.cjs');

/**
 * Upload blob data to Netlify Blobs
 * Allows manual restore of local blob data to the remote store
 */
exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Verify authentication
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded || decoded.role !== 'admin') {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Admin access required' })
            };
        }

        // Parse the request body
        const body = JSON.parse(event.body);
        const { storeName = 'records', key = 'data', data } = body;

        if (!data) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing data field' })
            };
        }

        // Get the blob store
        const store = getStore({
            name: storeName,
            siteID: SITE_ID,
            token: process.env.BLOB_AUTH_TOKEN
        });

        // Upload the data
        await store.setJSON(key, data);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Successfully uploaded blob data to ${storeName}/${key}`,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Upload error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to upload blob data',
                details: error.message
            })
        };
    }
};
