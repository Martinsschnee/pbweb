const { getUser } = require('./utils/auth.cjs');
const { readDB, writeDB } = require('./utils/db.cjs');

exports.handler = async (event, context) => {
    const user = getUser(event);
    if (!user || user.role !== 'admin') {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { id } = JSON.parse(event.body);

        if (!id) {
            return { statusCode: 400, body: JSON.stringify({ error: 'User ID is required' }) };
        }

        if (id === user.id) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Cannot delete yourself' }) };
        }

        const db = await readDB();

        // Check if user exists
        const userExists = db.users.some(u => u.id === id);
        if (!userExists) {
            return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
        }

        // Delete user
        db.users = db.users.filter(u => u.id !== id);

        // Unassign records owned by this user
        let recordsUpdated = 0;
        db.records = db.records.map(r => {
            if (r.ownerId === id) {
                recordsUpdated++;
                return { ...r, ownerId: null }; // Make unassigned
            }
            return r;
        });

        await writeDB(db);

        return { statusCode: 200, body: JSON.stringify({ message: 'User deleted', recordsUnassigned: recordsUpdated }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
