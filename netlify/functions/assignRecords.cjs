const { getUser } = require('./utils/auth.cjs');
const { readDB, writeDB } = require('./utils/db.cjs');

exports.handler = async (event, context) => {
    const user = getUser(event);
    if (!user || user.role !== 'admin') {
        return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { recordIds, targetUserId } = JSON.parse(event.body);

        if (!recordIds || !Array.isArray(recordIds) || !targetUserId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request' }) };
        }

        const db = await readDB();
        let updatedCount = 0;

        db.records = db.records.map(record => {
            if (recordIds.includes(record.id)) {
                updatedCount++;
                return { ...record, ownerId: targetUserId };
            }
            return record;
        });

        await writeDB(db);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, updatedCount })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
