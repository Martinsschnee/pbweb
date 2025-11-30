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

        // Try to find in records
        let index = db.records.findIndex(r => r.id === id);
        if (index !== -1) {
            db.records.splice(index, 1);
        } else {
            // Try to find in checked
            index = db.checked.findIndex(r => r.id === id);
            if (index !== -1) {
                db.checked.splice(index, 1);
            } else {
                return { statusCode: 404, body: JSON.stringify({ error: 'Record not found' }) };
            }
        }

        await writeDB(db);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
