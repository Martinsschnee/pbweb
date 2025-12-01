#!/usr/bin/env node

/**
 * Script to upload local blob data to Netlify Blobs
 * 
 * Usage:
 *   node upload-blobs.js <path-to-json> [--url=<function-url>] [--token=<auth-token>]
 * 
 * Examples:
 *   node upload-blobs.js .netlify/blobs/deploy/records/data.json
 *   node upload-blobs.js data.json --url=https://your-site.netlify.app/.netlify/functions/uploadBlobs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
let filePath = null;
let functionUrl = null;
let authToken = null;

for (const arg of args) {
    if (arg.startsWith('--url=')) {
        functionUrl = arg.substring(6);
    } else if (arg.startsWith('--token=')) {
        authToken = arg.substring(8);
    } else if (!arg.startsWith('--')) {
        filePath = arg;
    }
}

if (!filePath) {
    console.error('❌ Error: Please provide a path to the JSON file');
    console.log('\nUsage:');
    console.log('  node upload-blobs.js <path-to-json> [--url=<function-url>] [--token=<auth-token>]');
    console.log('\nExample:');
    console.log('  node upload-blobs.js .netlify/blobs/deploy/records/data.json');
    process.exit(1);
}

// Read the JSON file
let data;
try {
    const absolutePath = path.resolve(filePath);
    console.log(`📂 Reading file: ${absolutePath}`);
    const fileContent = fs.readFileSync(absolutePath, 'utf-8');
    data = JSON.parse(fileContent);
    console.log('✅ File loaded successfully');
    console.log(`   Records: ${data.records?.length || 0}`);
    console.log(`   Checked: ${data.checked?.length || 0}`);
} catch (error) {
    console.error(`❌ Error reading file: ${error.message}`);
    process.exit(1);
}

// Interactive prompt for missing information
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function prompt(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function main() {
    if (!functionUrl) {
        functionUrl = await prompt('🔗 Enter your Netlify site URL (e.g., https://your-site.netlify.app): ');
        functionUrl = functionUrl.trim();
        if (!functionUrl.endsWith('/.netlify/functions/uploadBlobs')) {
            if (functionUrl.endsWith('/')) {
                functionUrl = functionUrl.slice(0, -1);
            }
            functionUrl += '/.netlify/functions/uploadBlobs';
        }
    }

    if (!authToken) {
        authToken = await prompt('🔑 Enter your admin auth token (from browser localStorage): ');
        authToken = authToken.trim();
    }

    console.log('\n📤 Uploading data to Netlify...');

    // Prepare the request
    const url = new URL(functionUrl);
    const postData = JSON.stringify({
        storeName: 'records',
        key: 'data',
        data: data
    });

    const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'Authorization': `Bearer ${authToken}`
        }
    };

    // Make the request
    const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            try {
                const response = JSON.parse(responseData);

                if (res.statusCode === 200) {
                    console.log('✅ Upload successful!');
                    console.log(`   Message: ${response.message}`);
                    console.log(`   Timestamp: ${response.timestamp}`);
                } else {
                    console.error(`❌ Upload failed (${res.statusCode})`);
                    console.error(`   Error: ${response.error}`);
                    if (response.details) {
                        console.error(`   Details: ${response.details}`);
                    }
                }
            } catch (error) {
                console.error('❌ Error parsing response:', error.message);
                console.error('   Response:', responseData);
            }

            rl.close();
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request error:', error.message);
        rl.close();
    });

    // Send the request
    req.write(postData);
    req.end();
}

main();
