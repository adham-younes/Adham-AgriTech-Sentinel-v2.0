const https = require('https');

const projectId = 'prj_VR6e1D9316QYXv5QeY1xAsHJjj2p';
const token = process.env.VERCEL_TOKEN;

if (!token) {
  console.error('Error: VERCEL_TOKEN is not set');
  process.exit(1);
}

const options = {
  hostname: 'api.vercel.com',
  path: `/v9/projects/${projectId}`,
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('Successfully updated project settings:', JSON.parse(data).rootDirectory);
    } else {
      console.error('Failed to update settings:', res.statusCode, data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(JSON.stringify({
  rootDirectory: 'frontend'
}));

req.end();
