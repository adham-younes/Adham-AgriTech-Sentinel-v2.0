'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Lightweight automation that prepares follow-up tasks after a deployment.
 * Extend this script to call real queueing systems or external services.
 */

const rawPayload = process.env.CLIENT_PAYLOAD || process.argv[2] || '{}';

let payload;
try {
  payload = JSON.parse(rawPayload);
} catch (error) {
  console.warn('Unable to parse CLIENT_PAYLOAD, falling back to defaults.');
  payload = {};
}

const timestamp = new Date().toISOString();
const {
  branch = 'unknown',
  environment = 'unspecified',
  url = 'n/a',
} = payload;

const followUpTasks = [
  'Queue satellite raster cache refresh',
  'Sync AI assistant localized content',
  'Schedule ESD processing batch verification',
];

const lines = [
  '# Async Publishing Workflow Report',
  '',
  `- Timestamp: ${timestamp}`,
  `- Branch: ${branch}`,
  `- Environment: ${environment}`,
  `- Deployment URL: ${url}`,
  '',
  '## Queued Follow-up Tasks',
  ...followUpTasks.map((task) => `- ${task}`),
  '',
  '## Notes',
  '- This automation currently generates reporting artifacts and can be extended to execute queued jobs.',
  '- Update scripts/async-post-deploy.js when integrating with real messaging or job systems.',
  '',
];

const reportDir = path.join(process.cwd(), 'reports', 'async');
fs.mkdirSync(reportDir, { recursive: true });

const reportPath = path.join(reportDir, `report-${Date.now()}.md`);
fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');

console.log(lines.join('\n'));
console.log(`Report generated at ${reportPath}`);

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `report_path=${reportPath}\n`);
}
