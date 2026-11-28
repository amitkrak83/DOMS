const fs = require('fs');
const path = require('path');

async function deployBetaOta() {
  const htmlPath = path.resolve(__dirname, '../app/src/main/assets/index.html');
  if (!fs.existsSync(htmlPath)) {
    console.error("Error: Cannot find index.html at", htmlPath);
    process.exit(1);
  }
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  console.log(`Read index.html: ${htmlContent.length} chars (${(htmlContent.length / 1024).toFixed(1)} KB)`);

  const now = Date.now().toString();
  const apiKey = 'AIzaSyBBbUJ6DA0tRDALZC4Oqx_GX7F2R1K6qgc';

  // 1. Update vmh_system/ota_beta
  console.log("Updating vmh_system/ota_beta with latest Beta bundle...");
  const otaBetaPayload = {
    fields: {
      betaVersion: { stringValue: "2.5.3-beta" },
      betaBundle: { stringValue: htmlContent },
      updatedAt: { integerValue: now }
    }
  };

  const otaBetaUrl = `https://firestore.googleapis.com/v1/projects/verma-marriage-hall/databases/(default)/documents/vmh_system/ota_beta?key=${apiKey}&updateMask.fieldPaths=betaVersion&updateMask.fieldPaths=betaBundle&updateMask.fieldPaths=updatedAt`;
  
  const resBeta = await fetch(otaBetaUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(otaBetaPayload)
  });

  if (!resBeta.ok) {
    const errText = await resBeta.text();
    throw new Error(`Failed to update ota_beta: ${resBeta.status} - ${errText}`);
  }
  const betaJson = await resBeta.json();
  console.log("✅ ota_beta successfully updated to:", betaJson.fields.betaVersion.stringValue);

  // 2. Update vmh_system/ota_release: lock productionVersion at 2.1.2, update betaVersion to 2.5.3-beta
  console.log("Updating vmh_system/ota_release (betaVersion: 2.5.3-beta, productionVersion locked at 2.1.2)...");
  const otaReleasePayload = {
    fields: {
      betaVersion: { stringValue: "2.5.3-beta" },
      productionVersion: { stringValue: "2.1.2" },
      updatedAt: { integerValue: now }
    }
  };

  const otaReleaseUrl = `https://firestore.googleapis.com/v1/projects/verma-marriage-hall/databases/(default)/documents/vmh_system/ota_release?key=${apiKey}&updateMask.fieldPaths=betaVersion&updateMask.fieldPaths=productionVersion&updateMask.fieldPaths=updatedAt`;

  const resRel = await fetch(otaReleaseUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(otaReleasePayload)
  });

  if (!resRel.ok) {
    const errText = await resRel.text();
    throw new Error(`Failed to update ota_release: ${resRel.status} - ${errText}`);
  }
  const relJson = await resRel.json();
  console.log("✅ ota_release successfully updated!");
  console.log("betaVersion:", relJson.fields.betaVersion.stringValue);
  console.log("productionVersion:", relJson.fields.productionVersion.stringValue);
  console.log("\nALL OTA CLOUD DEPLOYMENTS COMPLETE!");
}

deployBetaOta().catch(err => {
  console.error("OTA Deploy error:", err);
  process.exit(1);
});
