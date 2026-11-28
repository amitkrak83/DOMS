const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '../app/src/main/assets/index.html');
if (!fs.existsSync(htmlPath)) {
  console.error("Error: Cannot find index.html at", htmlPath);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIdx = 0;
let totalErrors = 0;

console.log("Validating index.html script tags...");

while ((match = scriptRegex.exec(html)) !== null) {
  scriptIdx++;
  const scriptContent = match[1];
  if (!scriptContent.trim()) continue;
  try {
    new Function(scriptContent);
    console.log(`Script Block ${scriptIdx}: OK`);
  } catch (err) {
    totalErrors++;
    console.error(`Script Block ${scriptIdx} Error:`, err.message);
  }
}

if (totalErrors === 0) {
  console.log(`\n✅ ALL scripts (${scriptIdx}) VALID! HTML size: ${html.length} chars (${(html.length / 1024).toFixed(1)} KB)`);
} else {
  console.error(`\n❌ Found ${totalErrors} script errors!`);
  process.exit(1);
}
