const { getUser } = require('./utils/auth.cjs');
const { readDB } = require('./utils/db.cjs');

exports.handler = async (event, context) => {
    const user = getUser(event);
    if (!user) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const db = await readDB();
        return {
            statusCode: 200,
            body: JSON.stringify(db)
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
