
// import fetch from 'node-fetch'; // Using native fetch

const API_KEY = 'apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232';
const BASE_URL = 'https://api.eosda.com/v1';

async function testConnection() {
    console.log('Testing EOSDA Connection...');
    console.log(`URL: ${BASE_URL}/polygons/search`);
    console.log(`Key: ${API_KEY.substring(0, 10)}...`);

    try {
        const response = await fetch(`${BASE_URL}/polygons/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': API_KEY
            },
            body: JSON.stringify({
                limit: 1,
                page: 1,
                fields: ["id"],
                sort: { date: "desc" }
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('Success! Data received:', JSON.stringify(data, null, 2));
        } else {
            const text = await response.text();
            console.error('Error Body:', text);
        }

    } catch (error) {
        console.error('Connection Failed:', error);
    }
}

testConnection();
