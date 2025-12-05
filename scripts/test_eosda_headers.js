
const https = require('https');

const API_KEY = 'apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232';
const HOST = 'api.eos.com';
const PATH = '/v1/polygons/search';

console.log(`Testing ${HOST}${PATH} with header variations...`);

const data = JSON.stringify({
    limit: 1,
    page: 1,
    fields: ["id"],
    sort: { date: "desc" }
});

const variations = [
    { 'X-Api-Key': API_KEY },
    { 'x-api-key': API_KEY },
    { 'apikey': API_KEY },
    { 'Authorization': `ApiKey ${API_KEY}` },
    { 'Authorization': API_KEY } // Just in case
];

function test(headers) {
    return new Promise((resolve) => {
        console.log(`Testing headers: ${JSON.stringify(Object.keys(headers))}`);

        const options = {
            hostname: HOST,
            port: 443,
            path: PATH,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                ...headers
            }
        };

        const req = https.request(options, (res) => {
            console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                console.log(`Body: ${body.substring(0, 100)}`);
                resolve();
            });
        });

        req.on('error', (e) => {
            console.log(`Error: ${e.message}`);
            resolve();
        });

        req.write(data);
        req.end();
    });
}

async function run() {
    for (const headers of variations) {
        await test(headers);
    }
}

run();
