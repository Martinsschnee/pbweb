const { getUser } = require('./utils/auth.cjs');
const { readDB, writeDB } = require('./utils/db.cjs');

exports.handler = async (event, context) => {
    const user = getUser(event);
    if (!user) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { id } = JSON.parse(event.body);
        const db = await readDB();

        const recordIndex = db.records.findIndex(r => r.id === id);
        if (recordIndex === -1) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Record not found' }) };
        }

        const record = db.records[recordIndex];

        // Move to checked
        db.records.splice(recordIndex, 1);

        const checkedRecord = {
            ...record,
            checkedAt: new Date().toISOString(),
            checkedBy: user.username
        };

        db.checked.push(checkedRecord);
        await writeDB(db);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, record: checkedRecord })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
