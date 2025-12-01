const { getStore } = require('@netlify/blobs');
const { SITE_ID } = require('./utils/config.cjs');
const { getUser } = require('./utils/auth.cjs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const user = getUser(event);
    if (!user || user.role !== 'admin') {
        return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    try {
        const { username, password, role } = JSON.parse(event.body);

        if (!username || !password) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Username and password required' }) };
        }

        const store = getStore({
            name: 'users',
            siteID: SITE_ID,
            token: process.env.BLOB_AUTH_TOKEN,
        });

        const users = await store.get('all_users', { type: 'json' }) || [];

        if (users.find(u => u.username === username)) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Username already exists' }) };
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = {
            id: uuidv4(),
            username,
            passwordHash,
            role: role || 'user',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await store.setJSON('all_users', users);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role } })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
