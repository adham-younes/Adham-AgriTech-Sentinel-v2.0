
const https = require('https');

const API_KEY = 'apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232';

const CONFIGS = [
    { host: 'api-connect.eos.com', path: '/v1/polygons/search' },
    { host: 'api-connect.eos.com', path: '/api/v1/polygons/search' },
    { host: 'api.eos.com', path: '/v1/polygons/search' },
    { host: 'gate.eos.com', path: '/api/lms/search/v2/sentinel2' }, // LMS Search
];

console.log('Testing EOSDA Connection (Multi-Endpoint)...');

const data = JSON.stringify({
    limit: 1,
    page: 1,
    fields: ["id"],
    sort: { date: "desc" }
});

function test(config) {
    return new Promise((resolve) => {
        console.log(`Testing ${config.host}${config.path}...`);

        const options = {
            hostname: config.host,
            port: 443,
            path: config.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': API_KEY,
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            console.log(`[${config.host}] Status: ${res.statusCode} ${res.statusMessage}`);
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`[${config.host}] SUCCESS!`);
                } else {
                    console.log(`[${config.host}] Body: ${body.substring(0, 100)}`);
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.log(`[${config.host}] Error: ${e.message}`);
            resolve();
        });

        req.write(data);
        req.end();
    });
}

async function run() {
    for (const config of CONFIGS) {
        await test(config);
    }
}

run();
