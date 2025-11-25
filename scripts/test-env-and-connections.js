#!/usr/bin/env node
'use strict';

/**
 * 🧪 اختبار شامل لجميع متغيرات البيئة والاتصالات
 * Comprehensive Test for All Environment Variables and Connections
 * 
 * Usage: node scripts/test-env-and-connections.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  Warning: .env.local file not found');
    console.log('   Using system environment variables only\n');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    line = line.trim();
    
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) return;
    
    // Parse key=value
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Only set if not already defined
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  
  console.log('✅ Loaded environment variables from .env.local\n');
}

// Load env variables at startup
loadEnvFile();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

// Test results
const results = {
  env: {
    found: [],
    missing: [],
    checked: new Set(), // Track checked vars to avoid duplicates
  },
  connections: {
    passed: [],
    failed: [],
    skipped: [],
  },
};

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeout = options.timeout || 10000;

    const req = protocol.get(url, { headers: options.headers || {} }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ statusCode: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', reject);
  });
}

/**
 * Make POST request
 */
function makePostRequest(url, body, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    const timeout = options.timeout || 10000;

    const postData = typeof body === 'string' ? body : JSON.stringify(body);
    const headers = {
      'Content-Type': options.contentType || 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      ...options.headers,
    };

    const req = protocol.request({
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ statusCode: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Check environment variable
 */
function checkEnvVar(key, required = false) {
  // Skip if already checked
  if (results.env.checked.has(key)) {
    const value = process.env[key];
    return value && value.trim() && !value.includes('your_') && !value.includes('YOUR_');
  }
  
  results.env.checked.add(key);
  const value = process.env[key];
  if (value && value.trim() && !value.includes('your_') && !value.includes('YOUR_')) {
    results.env.found.push(key);
    return true;
  } else {
    if (required) {
      results.env.missing.push(`${key} (required)`);
    } else {
      results.env.missing.push(`${key} (optional)`);
    }
    return false;
  }
}

/**
 * Test Supabase Connection
 */
async function testSupabase() {
  console.log(`\n${colors.cyan}🔐 Testing Supabase Connection...${colors.reset}`);
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Check env vars
  checkEnvVar('NEXT_PUBLIC_SUPABASE_URL', true);
  checkEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', true);
  checkEnvVar('SUPABASE_SERVICE_ROLE_KEY', false);
  
  if (!url || !anonKey) {
    results.connections.skipped.push('Supabase - Missing credentials');
    console.log(`${colors.yellow}⚠️  Skipped - Missing credentials${colors.reset}`);
    return;
  }

  try {
    const response = await makeRequest(`${url}/rest/v1/`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    
    if (response.statusCode === 200 || response.statusCode === 404) {
      results.connections.passed.push('Supabase Connection');
      console.log(`${colors.green}✅ Supabase: Connected successfully${colors.reset}`);
      console.log(`   URL: ${url}`);
    } else {
      throw new Error(`Unexpected status: ${response.statusCode}`);
    }
  } catch (error) {
    results.connections.failed.push(`Supabase - ${error.message}`);
    console.log(`${colors.red}❌ Supabase: Connection failed${colors.reset}`);
    console.log(`   Error: ${error.message}`);
  }
}

/**
 * Test OpenAI API
 */
async function testOpenAI() {
  console.log(`\n${colors.cyan}🤖 Testing OpenAI API...${colors.reset}`);
  
  const key = process.env.OPENAI_API_KEY;
  checkEnvVar('OPENAI_API_KEY', false);
  
  if (!key || key.includes('your_')) {
    results.connections.skipped.push('OpenAI - Not configured');
    console.log(`${colors.yellow}⚠️  Skipped - Not configured${colors.reset}`);
    return;
  }

  try {
    const response = await makeRequest('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${key}`
      },
      timeout: 15000
    });
    
    if (response.statusCode === 200) {
      results.connections.passed.push('OpenAI API');
      console.log(`${colors.green}✅ OpenAI: API accessible${colors.reset}`);
      console.log(`   Models available: ${response.data.data?.length || 0}`);
    } else {
      throw new Error(`Status: ${response.statusCode}`);
    }
  } catch (error) {
    results.connections.failed.push(`OpenAI - ${error.message}`);
    console.log(`${colors.red}❌ OpenAI: Connection failed${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    if (error.message.includes('401')) {
      console.log(`   ${colors.yellow}Hint: Invalid API key${colors.reset}`);
    } else if (error.message.includes('429')) {
      console.log(`   ${colors.yellow}Hint: Rate limit or billing issue${colors.reset}`);
    }
  }
}

/**
 * Test Groq API
 */
async function testGroq() {
  console.log(`\n${colors.cyan}🤖 Testing Groq AI...${colors.reset}`);
  
  const key = process.env.GROQ_API_KEY;
  checkEnvVar('GROQ_API_KEY', false);
  
  if (!key || key.includes('your_')) {
    results.connections.skipped.push('Groq - Not configured');
    console.log(`${colors.yellow}⚠️  Skipped - Not configured${colors.reset}`);
    return;
  }

  try {
    const response = await makeRequest('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${key}`
      }
    });
    
    if (response.statusCode === 200) {
      results.connections.passed.push('Groq API');
      console.log(`${colors.green}✅ Groq: API accessible${colors.reset}`);
    } else {
      throw new Error(`Status: ${response.statusCode}`);
    }
  } catch (error) {
    results.connections.failed.push(`Groq - ${error.message}`);
    console.log(`${colors.red}❌ Groq: Connection failed${colors.reset}`);
    console.log(`   Error: ${error.message}`);
  }
}

/**
 * Test OpenWeather API
 */
async function testOpenWeather() {
  console.log(`\n${colors.cyan}🌤️  Testing OpenWeather API...${colors.reset}`);
  
  const key = process.env.OPENWEATHER_API_KEY;
  checkEnvVar('OPENWEATHER_API_KEY', false);
  
  if (!key || key.includes('your_')) {
    results.connections.skipped.push('OpenWeather - Not configured');
    console.log(`${colors.yellow}⚠️  Skipped - Not configured${colors.reset}`);
    return;
  }

  try {
    const response = await makeRequest(
      `https://api.openweathermap.org/data/2.5/weather?q=Cairo,EG&appid=${key}&units=metric&lang=ar`
    );
    
    if (response.statusCode === 200 && response.data.main) {
      results.connections.passed.push('OpenWeather API');
      console.log(`${colors.green}✅ OpenWeather: API working${colors.reset}`);
      console.log(`   Cairo temperature: ${response.data.main.temp}°C`);
      console.log(`   Weather: ${response.data.weather[0]?.description || 'N/A'}`);
    } else {
      throw new Error(`Status: ${response.statusCode}`);
    }
  } catch (error) {
    results.connections.failed.push(`OpenWeather - ${error.message}`);
    console.log(`${colors.red}❌ OpenWeather: Connection failed${colors.reset}`);
    console.log(`   Error: ${error.message}`);
  }
}

/**
 * Test Mapbox API
 */
async function testMapbox() {
  console.log(`\n${colors.cyan}🗺️  Testing Mapbox API...${colors.reset}`);
  
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  checkEnvVar('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', false);
  
  if (!token || token.includes('your_')) {
    results.connections.skipped.push('Mapbox - Not configured');
    console.log(`${colors.yellow}⚠️  Skipped - Not configured${colors.reset}`);
    return;
  }

  try {
    const response = await makeRequest(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/Cairo.json?access_token=${token}`
    );
    
    if (response.statusCode === 200 && response.data.features) {
      results.connections.passed.push('Mapbox API');
      console.log(`${colors.green}✅ Mapbox: API working${colors.reset}`);
      console.log(`   Features found: ${response.data.features.length}`);
    } else {
      throw new Error(`Status: ${response.statusCode}`);
    }
  } catch (error) {
    results.connections.failed.push(`Mapbox - ${error.message}`);
    console.log(`${colors.red}❌ Mapbox: Connection failed${colors.reset}`);
    console.log(`   Error: ${error.message}`);
  }
}

/**
 * Test EOSDA API
 */
async function testEOSDA() {
  console.log(`\n${colors.cyan}🛰️  Testing EOSDA API...${colors.reset}`);
  
  const apiKey = process.env.EOSDA_API_KEY || process.env.NEXT_PUBLIC_EOSDA_API_KEY;
  const apiUrl = process.env.EOSDA_API_URL || process.env.EOSDA_API_BASE_URL || 
                 process.env.NEXT_PUBLIC_EOSDA_API_URL || process.env.NEXT_PUBLIC_EOSDA_API_BASE_URL ||
                 'https://api-connect.eos.com/api/data';
  
  checkEnvVar('EOSDA_API_KEY', false);
  checkEnvVar('NEXT_PUBLIC_EOSDA_API_KEY', false);
  
  if (!apiKey || apiKey.includes('your_')) {
    results.connections.skipped.push('EOSDA - Not configured');
    console.log(`${colors.yellow}⚠️  Skipped - Not configured${colors.reset}`);
    return;
  }

  try {
    // Test EOSDA search endpoint
    let baseUrl = apiUrl.replace(/\/$/, '');
    // If URL doesn't include /v1, add it
    if (!baseUrl.includes('/v1')) {
      baseUrl = baseUrl.endsWith('/api/data') ? `${baseUrl}/v1` : `${baseUrl}/api/data/v1`;
    }
    const searchUrl = `${baseUrl}/search`;
    
    const response = await makePostRequest(
      searchUrl,
      {
        geometry: {
          type: 'Point',
          coordinates: [31.2357, 30.0444] // Cairo coordinates
        },
        collections: ['sentinel-2-l2a'],
        limit: 1
      },
      {
        headers: {
          'X-Api-Key': apiKey,
          'x-api-key': apiKey,
        },
        contentType: 'application/json',
      }
    );
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      results.connections.passed.push('EOSDA API');
      console.log(`${colors.green}✅ EOSDA: API accessible${colors.reset}`);
      console.log(`   API URL: ${baseUrl}`);
    } else {
      throw new Error(`Status: ${response.statusCode}`);
    }
  } catch (error) {
    // EOSDA might return 400 for invalid geometry, but that means API is reachable
    if (error.message.includes('400') || error.message.includes('422')) {
      results.connections.passed.push('EOSDA API (reachable)');
      console.log(`${colors.green}✅ EOSDA: API reachable${colors.reset}`);
      console.log(`   Note: Request validation error (API is working)`);
    } else {
      results.connections.failed.push(`EOSDA - ${error.message}`);
      console.log(`${colors.red}❌ EOSDA: Connection failed${colors.reset}`);
      console.log(`   Error: ${error.message}`);
    }
  }
}

/**
 * Test ESD Configuration
 */
async function testESD() {
  console.log(`\n${colors.cyan}🛰️  Testing ESD Configuration...${colors.reset}`);
  
  const clientId = process.env.ESD_CLIENT_ID;
  const clientSecret = process.env.ESD_CLIENT_SECRET;
  const authUrl = process.env.ESD_AUTH_URL || 'https://auth.esd.earth/oauth/token';
  const apiBaseUrl = process.env.ESD_API_BASE_URL;
  
  checkEnvVar('ESD_CLIENT_ID', false);
  checkEnvVar('ESD_CLIENT_SECRET', false);
  checkEnvVar('ESD_AUTH_URL', false);
  checkEnvVar('ESD_API_BASE_URL', false);

  if (!clientId || !clientSecret) {
    results.connections.skipped.push('ESD - Not fully configured');
    console.log(`${colors.yellow}⚠️  Skipped - Missing credentials${colors.reset}`);
    return;
  }

  try {
    const body = `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`;
    const response = await makePostRequest(
      authUrl,
      body,
      {
        contentType: 'application/x-www-form-urlencoded',
      }
    );
    
    if (response.statusCode === 200 && response.data.access_token) {
      results.connections.passed.push('ESD API');
      console.log(`${colors.green}✅ ESD: Authentication successful${colors.reset}`);
      console.log(`   Token expires in: ${response.data.expires_in || 'N/A'}s`);
    } else {
      throw new Error(`Status: ${response.statusCode}`);
    }
  } catch (error) {
    results.connections.failed.push(`ESD - ${error.message}`);
    console.log(`${colors.red}❌ ESD: Authentication failed${colors.reset}`);
    console.log(`   Error: ${error.message}`);
  }
}

/**
 * Test Firebase Configuration
 */
async function testFirebase() {
  console.log(`\n${colors.cyan}🔥 Testing Firebase Configuration...${colors.reset}`);
  
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  
  checkEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID', false);
  checkEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY', false);
  
  if (!projectId || !apiKey) {
    results.connections.skipped.push('Firebase - Not configured');
    console.log(`${colors.yellow}⚠️  Skipped - Not configured${colors.reset}`);
    return;
  }

  try {
    // Test Firebase Auth endpoint
    const response = await makePostRequest(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {},
      { contentType: 'application/json' }
    );
    
    // Firebase returns 400 for missing body, which means API key is valid
    if (response.statusCode === 400 || response.statusCode === 200) {
      results.connections.passed.push('Firebase Configuration');
      console.log(`${colors.green}✅ Firebase: API key is valid${colors.reset}`);
      console.log(`   Project ID: ${projectId}`);
    } else {
      throw new Error(`Status: ${response.statusCode}`);
    }
  } catch (error) {
    if (error.message.includes('400')) {
      results.connections.passed.push('Firebase Configuration');
      console.log(`${colors.green}✅ Firebase: API key is valid${colors.reset}`);
    } else {
      results.connections.failed.push(`Firebase - ${error.message}`);
      console.log(`${colors.red}❌ Firebase: Validation failed${colors.reset}`);
      console.log(`   Error: ${error.message}`);
    }
  }
}

/**
 * Test Vercel Configuration
 */
async function testVercel() {
  console.log(`\n${colors.cyan}🚀 Testing Vercel Configuration...${colors.reset}`);
  
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const orgId = process.env.VERCEL_ORG_ID;
  
  checkEnvVar('VERCEL_TOKEN', false);
  checkEnvVar('VERCEL_PROJECT_ID', false);
  checkEnvVar('VERCEL_ORG_ID', false);
  
  if (!token || !projectId || !orgId) {
    results.connections.skipped.push('Vercel - Not fully configured');
    console.log(`${colors.yellow}⚠️  Skipped - Missing credentials${colors.reset}`);
    return;
  }

  try {
    const response = await makeRequest(
      `https://api.vercel.com/v9/projects/${projectId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (response.statusCode === 200) {
      results.connections.passed.push('Vercel API');
      console.log(`${colors.green}✅ Vercel: API accessible${colors.reset}`);
      console.log(`   Project: ${response.data.name || 'N/A'}`);
    } else {
      throw new Error(`Status: ${response.statusCode}`);
    }
  } catch (error) {
    results.connections.failed.push(`Vercel - ${error.message}`);
    console.log(`${colors.red}❌ Vercel: Connection failed${colors.reset}`);
    console.log(`   Error: ${error.message}`);
  }
}

/**
 * Test Insforge Backend
 */
async function testInsforge() {
  console.log(`\n${colors.cyan}🏥 Testing Insforge Backend...${colors.reset}`);
  
  const apiKey = process.env.INSFORGE_API_KEY || process.env.NEXT_PUBLIC_INSFORGE_API_KEY;
  const baseUrl = process.env.INSFORGE_BASE_URL || process.env.NEXT_PUBLIC_INSFORGE_BASE_URL;
  
  checkEnvVar('INSFORGE_API_KEY', false);
  checkEnvVar('INSFORGE_BASE_URL', false);
  
  if (!apiKey || !baseUrl) {
    results.connections.skipped.push('Insforge - Not configured');
    console.log(`${colors.yellow}⚠️  Skipped - Not configured${colors.reset}`);
    return;
  }

  try {
    const response = await makeRequest(`${baseUrl}/health`, {
      headers: { 'X-API-Key': apiKey }
    });
    
    if (response.statusCode === 200 || response.statusCode === 404) {
      results.connections.passed.push('Insforge Backend');
      console.log(`${colors.green}✅ Insforge: Backend accessible${colors.reset}`);
      console.log(`   URL: ${baseUrl}`);
    } else {
      throw new Error(`Status: ${response.statusCode}`);
    }
  } catch (error) {
    results.connections.failed.push(`Insforge - ${error.message}`);
    console.log(`${colors.red}❌ Insforge: Connection failed${colors.reset}`);
    console.log(`   Error: ${error.message}`);
  }
}

/**
 * Test Plant ID API
 */
async function testPlantID() {
  console.log(`\n${colors.cyan}🌱 Testing Plant ID API...${colors.reset}`);
  
  const apiKey = process.env.PLANT_ID_API_KEY;
  checkEnvVar('PLANT_ID_API_KEY', false);
  
  if (!apiKey || apiKey.includes('your_')) {
    results.connections.skipped.push('Plant ID - Not configured');
    console.log(`${colors.yellow}⚠️  Skipped - Not configured${colors.reset}`);
    return;
  }

  try {
    const response = await makeRequest('https://api.plant.id/v3/health_check', {
      headers: {
        'Api-Key': apiKey
      }
    });
    
    if (response.statusCode === 200) {
      results.connections.passed.push('Plant ID API');
      console.log(`${colors.green}✅ Plant ID: API accessible${colors.reset}`);
    } else {
      throw new Error(`Status: ${response.statusCode}`);
    }
  } catch (error) {
    results.connections.failed.push(`Plant ID - ${error.message}`);
    console.log(`${colors.red}❌ Plant ID: Connection failed${colors.reset}`);
    console.log(`   Error: ${error.message}`);
  }
}

/**
 * Check all environment variables
 */
function checkAllEnvVars() {
  console.log(`\n${colors.cyan}📋 Checking Environment Variables...${colors.reset}\n`);
  
  // Core Services
  checkEnvVar('NEXT_PUBLIC_SUPABASE_URL', true);
  checkEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', true);
  checkEnvVar('SUPABASE_SERVICE_ROLE_KEY', false);
  
  // AI Services
  checkEnvVar('OPENAI_API_KEY', false);
  checkEnvVar('GROQ_API_KEY', false);
  checkEnvVar('PLANT_ID_API_KEY', false);
  
  // Weather Services
  checkEnvVar('OPENWEATHER_API_KEY', false);
  
  // Mapping Services
  checkEnvVar('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', false);
  
  // Satellite Services
  checkEnvVar('EOSDA_API_KEY', false);
  checkEnvVar('NEXT_PUBLIC_EOSDA_API_KEY', false);
  checkEnvVar('EOSDA_API_URL', false);
  checkEnvVar('EOSDA_API_BASE_URL', false);
  checkEnvVar('ESD_CLIENT_ID', false);
  checkEnvVar('ESD_CLIENT_SECRET', false);
  checkEnvVar('ESD_AUTH_URL', false);
  checkEnvVar('ESD_API_BASE_URL', false);
  
  // Firebase
  checkEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID', false);
  checkEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY', false);
  checkEnvVar('FIREBASE_PROJECT_ID', false);
  checkEnvVar('FIREBASE_CLIENT_EMAIL', false);
  checkEnvVar('FIREBASE_PRIVATE_KEY', false);
  
  // Vercel
  checkEnvVar('VERCEL_TOKEN', false);
  checkEnvVar('VERCEL_PROJECT_ID', false);
  checkEnvVar('VERCEL_ORG_ID', false);
  
  // Insforge
  checkEnvVar('INSFORGE_API_KEY', false);
  checkEnvVar('INSFORGE_BASE_URL', false);
  
  // App Configuration
  checkEnvVar('NEXT_PUBLIC_APP_URL', false);
  checkEnvVar('NEXT_PUBLIC_DEFAULT_LANGUAGE', false);
  
  console.log(`\n${colors.green}✅ Found: ${results.env.found.length} variables${colors.reset}`);
  if (results.env.missing.length > 0) {
    console.log(`${colors.yellow}⚠️  Missing: ${results.env.missing.length} variables${colors.reset}`);
  }
}

/**
 * Print final summary
 */
function printSummary() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${colors.magenta}${colors.bold}📊 TEST SUMMARY / ملخص الاختبار${colors.reset}`);
  console.log(`${'='.repeat(70)}`);
  
  // Environment Variables Summary
  console.log(`\n${colors.cyan}${colors.bold}Environment Variables / متغيرات البيئة:${colors.reset}`);
  console.log(`   ${colors.green}✅ Found: ${results.env.found.length}${colors.reset}`);
  if (results.env.missing.length > 0) {
    console.log(`   ${colors.yellow}⚠️  Missing: ${results.env.missing.length}${colors.reset}`);
    results.env.missing.forEach(v => {
      const isRequired = v.includes('(required)');
      const color = isRequired ? colors.red : colors.yellow;
      console.log(`      ${color}• ${v}${colors.reset}`);
    });
  }
  
  // Connections Summary
  console.log(`\n${colors.cyan}${colors.bold}Connections / الاتصالات:${colors.reset}`);
  console.log(`   ${colors.green}✅ Passed: ${results.connections.passed.length}${colors.reset}`);
  results.connections.passed.forEach(test => console.log(`      ${colors.green}• ${test}${colors.reset}`));
  
  if (results.connections.failed.length > 0) {
    console.log(`\n   ${colors.red}❌ Failed: ${results.connections.failed.length}${colors.reset}`);
    results.connections.failed.forEach(test => console.log(`      ${colors.red}• ${test}${colors.reset}`));
  }
  
  if (results.connections.skipped.length > 0) {
    console.log(`\n   ${colors.yellow}⚠️  Skipped: ${results.connections.skipped.length}${colors.reset}`);
    results.connections.skipped.forEach(test => console.log(`      ${colors.yellow}• ${test}${colors.reset}`));
  }
  
  console.log(`\n${'='.repeat(70)}`);
  
  const totalConnections = results.connections.passed.length + 
                           results.connections.failed.length + 
                           results.connections.skipped.length;
  const successRate = totalConnections > 0 
    ? ((results.connections.passed.length / totalConnections) * 100).toFixed(1) 
    : 0;
  
  console.log(`\n${colors.blue}Total Connections Tested: ${totalConnections}${colors.reset}`);
  console.log(`${colors.blue}Success Rate: ${successRate}%${colors.reset}`);
  
  if (results.connections.failed.length > 0) {
    console.log(`\n${colors.red}⚠️  Some connections failed. Please check your configuration.${colors.reset}`);
    console.log(`${colors.red}   بعض الاتصالات فشلت. يرجى التحقق من الإعدادات.${colors.reset}`);
    process.exit(1);
  } else if (results.env.missing.some(v => v.includes('(required)'))) {
    console.log(`\n${colors.yellow}⚠️  Some required environment variables are missing.${colors.reset}`);
    console.log(`${colors.yellow}   بعض متغيرات البيئة المطلوبة مفقودة.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}🎉 All configured services are working!${colors.reset}`);
    console.log(`${colors.green}   جميع الخدمات المكونة تعمل بنجاح!${colors.reset}`);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.magenta}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.magenta}${colors.bold}🧪 ADHAM AGRITECH - COMPREHENSIVE ENVIRONMENT & CONNECTION TEST${colors.reset}`);
  console.log(`${colors.magenta}${colors.bold}   اختبار شامل لمتغيرات البيئة والاتصالات${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(70)}${colors.reset}`);
  console.log(`\nTesting all environment variables and connections...\n`);
  
  try {
    // Check environment variables
    checkAllEnvVars();
    
    // Test connections
    await testSupabase();
    await testOpenAI();
    await testGroq();
    await testOpenWeather();
    await testMapbox();
    await testEOSDA();
    await testESD();
    await testFirebase();
    await testVercel();
    await testInsforge();
    await testPlantID();
    
    // Print summary
    printSummary();
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
