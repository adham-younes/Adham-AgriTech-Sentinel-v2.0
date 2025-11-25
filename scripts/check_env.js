const fs = require('fs');
const path = require('path');

console.log("🔍 Starting Operation Green Horizon Environment Check...");

const envPath = path.join(process.cwd(), '.env.local');
let envVars = {};

if (fs.existsSync(envPath)) {
    console.log("✅ .env.local found.");
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envVars[key.trim()] = value.trim();
        }
    });
} else {
    console.error("❌ .env.local NOT found!");
    process.exit(1);
}

const requiredKeys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'EOSDA_API_KEY'
];

let missing = [];

requiredKeys.forEach(key => {
    if (envVars[key]) {
        console.log(`✅ ${key} is present.`);
    } else {
        console.error(`❌ ${key} is MISSING.`);
        missing.push(key);
    }
});

if (missing.length > 0) {
    console.error("🚨 Critical Environment Variables Missing. Operation Halted.");
    process.exit(1);
} else {
    console.log("🟢 All Systems Go. Environment Valid.");
}
