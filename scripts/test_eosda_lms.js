
const https = require('https');

const API_KEY = 'apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232';
const HOST = 'api-connect.eos.com';
const PATH = '/api/lms/search/v2/sentinel2';

console.log(`Testing ${HOST}${PATH} with valid body...`);

const body = JSON.stringify({
    "fields": ["sceneID", "cloudCoverage", "date", "view_id", "dataGeometry"],
    "limit": 1,
    "page": 1,
    "search": {
        "date": { "from": "2024-01-01", "to": "2024-12-31" },
        "cloudCoverage": { "from": 0, "to": 100 },
        "shapeRelation": "INTERSECTS",
        "shape": {
            "type": "Point",
            "coordinates": [32.55524, 25.30084]
        }
    },
    "sort": { "date": "desc" }
});

const options = {
    hostname: HOST,
    port: 443,
    path: PATH,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY,
        'Content-Length': body.length
    }
};

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
    let responseBody = '';
    res.on('data', c => responseBody += c);
    res.on('end', () => {
        console.log(`Body: ${responseBody.substring(0, 500)}`);
    });
});

req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
});

req.write(body);
req.end();
