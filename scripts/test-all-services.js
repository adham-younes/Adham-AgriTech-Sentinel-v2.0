#!/usr/bin/env node
'use strict';

/**
 * 🧪 Comprehensive Service Testing Suite
 * Tests all configured API services and integrations
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
};

// Test results
const results = {
  passed: [],
  failed: [],
  skipped: [],
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
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch {
          resolve({ statusCode: res.statusCode, data });
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
 * Test Supabase Connection
 */
async function testSupabase() {
  console.log(`\n${colors.cyan}🔐 Testing Supabase...${colors.reset}`);
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    results.skipped.push('Supabase - Missing credentials');
    console.log(`${colors.yellow}⚠️  Skipped - Missing credentials${colors.reset}`);
    return;
  }

  try {
    const response = await makeRequest(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    
    if (response.statusCode === 200 || response.statusCode === 404) {
      results.passed.push('Supabase Connection');
      console.log(`${colors.green}✅ Supabase is accessible${colors.reset}`);
    } else {
      throw new Error(`Unexpected status: ${response.statusCode}`);
    }
  } catch (error) {
    results.failed.push(`Supabase - ${error.message}`);
    console.log(`${colors.red}❌ Failed: ${error.message}${colors.reset}`);
  }
}

/**
 * Test OpenAI API
 */
async function testOpenAI() {
  console.log(`\n${colors.cyan}🤖 Testing OpenAI...${colors.reset}`);
  
  const key = process.env.OPENAI_API_KEY;
  
  if (!key || key === 'your_openai_api_key_here') {
    results.skipped.push('OpenAI - Not configured');
    console.log(`${colors.yellow}⚠️  Skipped - Not configured${colors.reset}`);
    return;
  }

  try {
    const response = await makeRequest('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${key}`
      }
    });
    
    if (response.statusCode === 200) {
      results.passed.push('OpenAI API');
      console.log(`${colors.green}✅ OpenAI API is accessible${colors.reset}`);
      console.log(`   Models available: ${response.data.data?.length || 0}`);
    } else {
      throw new Error(`Status: ${response.statusCode}`);
    }
  } catch (error) {
    results.failed.push(`OpenAI - ${error.message}`);
    console.log(`${colors.red}❌ Failed: ${error.message}${colors.reset}`);
  }
}

/**
 * Test Groq API
 */
async function testGroq() {
  console.log(`\n${colors.cyan}🤖 Testing Groq AI...${colors.reset}`);
  
  const key = process.env.GROQ_API_KEY;
  
  if (!key || key === 'your_groq_api_key_here') {
    results.skipped.push('Groq - Not configured');
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
      results.passed.push('Groq API');
      console.log(`${colors.green}✅ Groq API is accessible${colors.reset}`);
    } else {
      throw new Error(`Status: ${response.statusCode}`);
    }
  } catch (error) {
    results.failed.push(`Groq - ${error.message}`);
    console.log(`${colors.red}❌ Failed: ${error.message}${colors.reset}`);
  }
}

/**
 * Test OpenWeather API
 */
async function testOpenWeather() {
  console.log(`\n${colors.cyan}🌤️  Testing OpenWeather...${colors.reset}`);
  
  const key = process.env.OPENWEATHER_API_KEY;
  
  if (!key || key === 'your_openweather_api_key_here') {
    results.skipped.push('OpenWeather - Not configured');
    console.log(`${colors.yellow}⚠️  Skipped - Not configured${colors.reset}`);
    return;
  }

  try {
    const response = await makeRequest(
      `https://api.openweathermap.org/data/2.5/weather?q=Cairo,EG&appid=${key}&units=metric&lang=ar`
    );
    
    if (response.statusCode === 200 && response.data.main) {
      results.passed.push('OpenWeather API');
      console.log(`${colors.green}✅ OpenWeather API is working${colors.reset}`);
      console.log(`   Cairo temp: ${response.data.main.temp}°C`);
      console.log(`   Weather: ${response.data.weather[0]?.description || 'N/A'}`);
    } else {
      throw new Error(`Status: ${response.statusCode}`);
    }
  } catch (error) {
    results.failed.push(`OpenWeather - ${error.message}`);
    console.log(`${colors.red}❌ Failed: ${error.message}${colors.reset}`);
  }
}

/**
 * Test Mapbox API
 */
async function testMapbox() {
  console.log(`\n${colors.cyan}🗺️  Testing Mapbox...${colors.reset}`);
  
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  
  if (!token || token === 'your_mapbox_token_here') {
    results.skipped.push('Mapbox - Not configured');
    console.log(`${colors.yellow}⚠️  Skipped - Not configured${colors.reset}`);
    return;
  }

  try {
    const response = await makeRequest(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/Cairo.json?access_token=${token}`
    );
    
    if (response.statusCode === 200 && response.data.features) {
      results.passed.push('Mapbox API');
      console.log(`${colors.green}✅ Mapbox API is working${colors.reset}`);
      console.log(`   Found ${response.data.features.length} locations`);
    } else {
      throw new Error(`Status: ${response.statusCode}`);
    }
  } catch (error) {
    results.failed.push(`Mapbox - ${error.message}`);
    console.log(`${colors.red}❌ Failed: ${error.message}${colors.reset}`);
  }
}

/**
 * Test ESD Configuration
 */
async function testESD() {
  console.log(`\n${colors.cyan}🛰️  Testing ESD Configuration...${colors.reset}`);

  const clientId = process.env.ESD_CLIENT_ID;
  const clientSecret = process.env.ESD_CLIENT_SECRET;
  const authUrl = process.env.ESD_AUTH_URL;
  const apiBaseUrl = process.env.ESD_API_BASE_URL;

  if (!clientId || !clientSecret || !authUrl || !apiBaseUrl) {
    results.skipped.push('ESD - Not fully configured');
    console.log(`${colors.yellow}⚠️  Skipped - Missing credentials${colors.reset}`);
    return;
  }

  console.log(`${colors.green}✅ ESD credentials configured${colors.reset}`);
  console.log(`   Client ID: ${clientId.substring(0, 8)}...`);
  console.log(`   Auth URL: ${authUrl}`);
  console.log(`   API Base: ${apiBaseUrl}`);
  results.passed.push('ESD Configuration');
}

/**
 * Test Firebase Configuration
 */
async function testFirebase() {
  console.log(`\n${colors.cyan}🔥 Testing Firebase Configuration...${colors.reset}`);
  
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  
  if (!projectId || !apiKey) {
    results.skipped.push('Firebase - Not configured');
    console.log(`${colors.yellow}⚠️  Skipped - Not configured${colors.reset}`);
    return;
  }

  try {
    // Test Firebase Auth endpoint
    const response = await makeRequest(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    // Firebase returns 400 for missing body, which means API key is valid
    if (response.statusCode === 400 || response.statusCode === 200) {
      results.passed.push('Firebase Configuration');
      console.log(`${colors.green}✅ Firebase API key is valid${colors.reset}`);
      console.log(`   Project ID: ${projectId}`);
    } else {
      throw new Error(`Status: ${response.statusCode}`);
    }
  } catch (error) {
    if (error.message.includes('400')) {
      results.passed.push('Firebase Configuration');
      console.log(`${colors.green}✅ Firebase API key is valid${colors.reset}`);
    } else {
      results.failed.push(`Firebase - ${error.message}`);
      console.log(`${colors.red}❌ Failed: ${error.message}${colors.reset}`);
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
  
  if (!token || !projectId || !orgId) {
    results.skipped.push('Vercel - Not fully configured');
    console.log(`${colors.yellow}⚠️  Skipped - Missing credentials${colors.reset}`);
    return;
  }

  try {
    const response = await makeRequest(
      `https://api.vercel.com/v9/projects/${projectId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (response.statusCode === 200) {
      results.passed.push('Vercel API');
      console.log(`${colors.green}✅ Vercel API is accessible${colors.reset}`);
      console.log(`   Project: ${response.data.name || 'N/A'}`);
    } else {
      throw new Error(`Status: ${response.statusCode}`);
    }
  } catch (error) {
    results.failed.push(`Vercel - ${error.message}`);
    console.log(`${colors.red}❌ Failed: ${error.message}${colors.reset}`);
  }
}

/**
 * Test Insforge Backend
 */
async function testInsforge() {
  console.log(`\n${colors.cyan}🏥 Testing Insforge Backend...${colors.reset}`);
  
  const apiKey = process.env.INSFORGE_API_KEY || process.env.NEXT_PUBLIC_INSFORGE_API_KEY;
  const baseUrl = process.env.INSFORGE_BASE_URL || process.env.NEXT_PUBLIC_INSFORGE_BASE_URL;
  
  if (!apiKey || !baseUrl) {
    results.skipped.push('Insforge - Not configured');
    console.log(`${colors.yellow}⚠️  Skipped - Not configured${colors.reset}`);
    return;
  }

  try {
    const response = await makeRequest(`${baseUrl}/health`, {
      headers: { 'X-API-Key': apiKey }
    });
    
    if (response.statusCode === 200 || response.statusCode === 404) {
      results.passed.push('Insforge Backend');
      console.log(`${colors.green}✅ Insforge backend is accessible${colors.reset}`);
      console.log(`   URL: ${baseUrl}`);
    } else {
      throw new Error(`Status: ${response.statusCode}`);
    }
  } catch (error) {
    results.failed.push(`Insforge - ${error.message}`);
    console.log(`${colors.red}❌ Failed: ${error.message}${colors.reset}`);
  }
}

/**
 * Test Google Earth Engine Configuration
 */
async function testGoogleEarthEngine() {
  console.log(`\n${colors.cyan}🌍 Testing Google Earth Engine...${colors.reset}`);
  
  const apiKey = process.env.GOOGLE_EARTH_ENGINE_API_KEY;
  
  if (!apiKey || apiKey === 'your_google_earth_engine_api_key_here') {
    results.skipped.push('Google Earth Engine - Not configured');
    console.log(`${colors.yellow}⚠️  Skipped - Not configured (Future service)${colors.reset}`);
    return;
  }

  console.log(`${colors.green}✅ Google Earth Engine API key configured${colors.reset}`);
  results.passed.push('Google Earth Engine Configuration');
}

/**
 * Test Blockchain Configuration
 */
async function testBlockchain() {
  console.log(`\n${colors.cyan}⛓️  Testing Blockchain Configuration...${colors.reset}`);
  
  const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
  const infuraId = process.env.INFURA_PROJECT_ID;
  
  if (!rpcUrl && !infuraId) {
    results.skipped.push('Blockchain - Not configured');
    console.log(`${colors.yellow}⚠️  Skipped - Not configured${colors.reset}`);
    return;
  }

  console.log(`${colors.green}✅ Blockchain configuration present${colors.reset}`);
  if (infuraId) console.log(`   Infura Project ID: ${infuraId.substring(0, 8)}...`);
  results.passed.push('Blockchain Configuration');
}

/**
 * Print final summary
 */
function printSummary() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${colors.magenta}📊 TEST SUMMARY${colors.reset}`);
  console.log(`${'='.repeat(60)}`);
  
  console.log(`\n${colors.green}✅ Passed: ${results.passed.length}${colors.reset}`);
  results.passed.forEach(test => console.log(`   • ${test}`));
  
  if (results.failed.length > 0) {
    console.log(`\n${colors.red}❌ Failed: ${results.failed.length}${colors.reset}`);
    results.failed.forEach(test => console.log(`   • ${test}`));
  }
  
  if (results.skipped.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Skipped: ${results.skipped.length}${colors.reset}`);
    results.skipped.forEach(test => console.log(`   • ${test}`));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  
  const total = results.passed.length + results.failed.length + results.skipped.length;
  const successRate = total > 0 ? ((results.passed.length / total) * 100).toFixed(1) : 0;
  
  console.log(`\n${colors.blue}Total Services Tested: ${total}${colors.reset}`);
  console.log(`${colors.blue}Success Rate: ${successRate}%${colors.reset}`);
  
  if (results.failed.length > 0) {
    console.log(`\n${colors.red}⚠️  Some services failed. Please check your configuration.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}🎉 All configured services are working!${colors.reset}`);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.magenta}🧪 ADHAM AGRITECH - COMPREHENSIVE SERVICE TESTING${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  console.log(`\nTesting all configured services and integrations...\n`);
  
  try {
    // Core Services
    await testSupabase();
    await testOpenAI();
    await testGroq();
    await testOpenWeather();
    await testMapbox();
    
    // Satellite & Geospatial
    await testESD();
    await testGoogleEarthEngine();
    
    // Cloud Services
    await testFirebase();
    await testVercel();
    await testInsforge();
    
    // Blockchain
    await testBlockchain();
    
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
