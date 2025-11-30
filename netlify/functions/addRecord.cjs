const { getUser } = require('./utils/auth.cjs');
const { readDB, writeDB } = require('./utils/db.cjs');
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event, context) => {
    const user = getUser(event);
    if (!user) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { rawLine, parsedData } = JSON.parse(event.body);

        if (!rawLine || !parsedData) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing data' }) };
        }

        const db = await readDB();
        const newRecord = {
            id: uuidv4(),
            rawLine,
            parsedData,
            createdAt: new Date().toISOString()
        };

        db.records.push(newRecord);
        await writeDB(db);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, record: newRecord })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
