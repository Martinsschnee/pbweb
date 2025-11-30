const { getStore } = require('@netlify/blobs');
const { SITE_ID } = require('./config.cjs');

// Initialize the store
// "records" is the default name, but can be overridden via env var
const storeName = process.env.BLOB_STORE_NAME || 'records';
const token = process.env.BLOB_AUTH_TOKEN;

// Explicitly pass credentials if provided (allows cross-site access or manual config)
const store = getStore({
    name: storeName,
    siteID: SITE_ID,
    token: token
});

async function readDB() {
    try {
        // Get the 'data' blob
        const data = await store.get('data', { type: 'json' });

        if (!data) {
            // Initialize if empty
            const initialData = { records: [], checked: [] };
            return initialData;
        }

        return data;
    } catch (error) {
        console.error("DB Read Error:", error);
        return { records: [], checked: [] };
    }
}

async function writeDB(data) {
    try {
        await store.setJSON('data', data);
        return true;
    } catch (error) {
        console.error("DB Write Error:", error);
        return false;
    }
}

module.exports = { readDB, writeDB };
