const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-me';

function getUser(event) {
    try {
        const cookies = cookie.parse(event.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return null;

        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
}

function generateToken(user) {
    return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
}

module.exports = { getUser, generateToken, JWT_SECRET };
