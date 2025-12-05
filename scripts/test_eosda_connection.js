
const https = require('https');

const API_KEY = 'apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232';
const HOST = 'api-connect.eos.com';
const PATH = '/v1/polygons/search';

console.log('Testing EOSDA Connection (Node.js https)...');

const data = JSON.stringify({
    limit: 1,
    page: 1,
    fields: ["id"],
    sort: { date: "desc" }
});

const options = {
    hostname: HOST,
    port: 443,
    path: PATH,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY,
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('Response Body:', body.substring(0, 500)); // Print first 500 chars
    });
});

req.on('error', (error) => {
    console.error('Connection Failed:', error);
});

req.write(data);
req.end();
