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
        const body = JSON.parse(event.body);
        const db = await readDB();
        const newRecords = [];

        // Normalize input to array
        const items = Array.isArray(body) ? body : [body];

        for (const item of items) {
            const { rawLine, parsedData } = item;
            if (!rawLine || !parsedData) continue;

            const newRecord = {
                id: uuidv4(),
                rawLine,
                parsedData,
                ownerId: user.id,
                createdAt: new Date().toISOString()
            };
            newRecords.push(newRecord);
            db.records.push(newRecord);
        }

        if (newRecords.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: 'No valid data found' }) };
        }

        await writeDB(db);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, count: newRecords.length, records: newRecords })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
