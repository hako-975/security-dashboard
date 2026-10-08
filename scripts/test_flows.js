import crypto from 'crypto';

const TARGET_URL = process.env.TEST_URL || 'http://localhost:3000/api/webhook';
const HMAC_SECRET = process.env.HMAC_SECRET || 'rahasia-hmac-anda';

async function runSecurityTests() {
  console.log('=== MENJALANKAN PENGUJIAN 3 SKENARIO KEAMANAN WEBHOOK ===\n');

  const payload = {
    id: 'ancaman-001',
    type: 'SQL Injection',
    status: 'bahaya',
    timestamp: new Date().toISOString()
  };
  const bodyString = JSON.stringify(payload);

  const validSignature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(bodyString)
    .digest('hex');

  // Skenario A: Valid signature (HMAC benar) -> Harus 200 OK & Telegram menerima pesan
  try {
    const res = await fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': validSignature
      },
      body: bodyString
    });
    const result = await res.json();
    console.log(`[Skenario A - Valid Signature] Status HTTP: ${res.status}`);
    if (res.status === 200) {
      console.log('✅ BERHASIL: Webhook menerima signature valid dan sukses memproses (200).');
    } else {
      console.log('❌ GAGAL: Diharapkan 200, mendapatkan:', res.status, result);
    }
  } catch (err) {
    console.log('❌ ERROR Test A:', err.message);
  }

  console.log('-'.repeat(60));

  // Skenario B: Tampered signature (Diubah/rusak) -> Harus 401 Unauthorized
  try {
    const invalidSignature = 'a1b2c3d4e5f67890invalid123456789abcdef';
    const res = await fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': invalidSignature
      },
      body: bodyString
    });
    const result = await res.json();
    console.log(`[Skenario B - Tampered Signature] Status HTTP: ${res.status}`);
    if (res.status === 401) {
      console.log('✅ BERHASIL: Webhook menolak signature palsu/rusak dengan kode 401.');
    } else {
      console.log('❌ GAGAL: Diharapkan 401, mendapatkan:', res.status, result);
    }
  } catch (err) {
    console.log('❌ ERROR Test B:', err.message);
  }

  console.log('-'.repeat(60));

  // Skenario C: Missing signature (Tanpa header x-signature) -> Harus 400 Bad Request
  try {
    const res = await fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // x-signature sengaja dihilangkan
      },
      body: bodyString
    });
    const result = await res.json();
    console.log(`[Skenario C - Missing Signature] Status HTTP: ${res.status}`);
    if (res.status === 400) {
      console.log('✅ BERHASIL: Webhook menolak permintaan tanpa header signature dengan kode 400.');
    } else {
      console.log('❌ GAGAL: Diharapkan 400, mendapatkan:', res.status, result);
    }
  } catch (err) {
    console.log('❌ ERROR Test C:', err.message);
  }

  console.log('\n=== PENGUJIAN SELESAI ===');
}

runSecurityTests();