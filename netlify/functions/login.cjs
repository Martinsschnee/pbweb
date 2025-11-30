const { generateToken } = require('./utils/auth.cjs');
const bcrypt = require('bcryptjs');
const cookie = require('cookie');
const { getStore } = require('@netlify/blobs');
const { SITE_ID } = require('./utils/config.cjs');

const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

// Helper to validate password (using env var for flexibility)
const getAdminPasswordHash = async () => {
    const plain = process.env.ADMIN_PASSWORD || 'admin123';
    return await bcrypt.hash(plain, 10);
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { username, password } = JSON.parse(event.body);
    const ip = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';

    // Initialize rate limiting store
    const storeName = process.env.BLOB_STORE_NAME_RATE_LIMIT || 'rate_limits';
    const blobToken = process.env.BLOB_AUTH_TOKEN;

    const store = getStore({
        name: storeName,
        siteID: SITE_ID,
        token: blobToken
    });

    // Helper to get/set rate limits
    const getRateLimit = async (ip) => {
        try {
            return await store.get(ip, { type: 'json' }) || { count: 0, lastAttempt: 0 };
        } catch (e) { return { count: 0, lastAttempt: 0 }; }
    };

    const updateRateLimit = async (ip, data) => {
        try {
            await store.setJSON(ip, data);
        } catch (e) { console.error(e); }
    };

    const { count, lastAttempt } = await getRateLimit(ip);

    // Check Lockout
    if (count >= MAX_ATTEMPTS && Date.now() - lastAttempt < LOCKOUT_TIME) {
        return {
            statusCode: 429,
            body: JSON.stringify({ error: 'Too many failed attempts. Try again later.' })
        };
    }

    // Reset if lockout expired
    let currentCount = count;
    if (Date.now() - lastAttempt > LOCKOUT_TIME) {
        currentCount = 0;
    }

    // Verify Credentials
    if (username !== 'admin') {
        await updateRateLimit(ip, { count: currentCount + 1, lastAttempt: Date.now() });
        return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }

    const targetHash = await getAdminPasswordHash();
    const match = await bcrypt.compare(password, targetHash);

    if (!match) {
        await updateRateLimit(ip, { count: currentCount + 1, lastAttempt: Date.now() });
        return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }

    // Success - Reset attempts
    await updateRateLimit(ip, { count: 0, lastAttempt: Date.now() });

    const token = generateToken({ id: '1', username: 'admin' });

    const cookieHeader = cookie.serialize('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Secure in prod
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
    });

    return {
        statusCode: 200,
        headers: {
            'Set-Cookie': cookieHeader,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: true, user: { username: 'admin' } })
    };
};
