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
        const page = parseInt(event.queryStringParameters?.page || '1');
        const limit = parseInt(event.queryStringParameters?.limit || '50');
        const targetUserId = event.queryStringParameters?.targetUserId;

        // Filter by ownership
        // Legacy records (no ownerId) are assumed to belong to admin (id '1')
        const userRecords = db.records.filter(r => {
            if (user.role === 'admin') {
                if (targetUserId) {
                    if (targetUserId === 'unassigned') return !r.ownerId;
                    return r.ownerId === targetUserId;
                }
                // Default admin view: own records + legacy
                return r.ownerId === user.id || !r.ownerId;
            }
            // Regular users only see their own
            return r.ownerId === user.id;
        });

        // Filter checked records by ownership
        const userChecked = db.checked.filter(r => {
            if (user.role === 'admin') {
                if (targetUserId) {
                    if (targetUserId === 'unassigned') return !r.ownerId;
                    return r.ownerId === targetUserId;
                }
                return r.ownerId === user.id || !r.ownerId;
            }
            return r.ownerId === user.id;
        });

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedRecords = userRecords.slice(startIndex, endIndex);

        return {
            statusCode: 200,
            body: JSON.stringify({
                records: paginatedRecords,
                checked: userChecked,
                total: userRecords.length,
                page,
                totalPages: Math.ceil(userRecords.length / limit)
            })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
