import crypto from 'crypto';

export default async function handler(req, res) {
  // Pastikan method adalah POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Validasi keberadaan header x-signature
  const signature = req.headers['x-signature'];
  if (!signature) {
    return res.status(400).json({ error: 'Bad Request: Missing x-signature header' });
  }

  const hmacSecret = process.env.HMAC_SECRET;
  if (!hmacSecret) {
    return res.status(500).json({ error: 'Server Error: HMAC_SECRET is not configured' });
  }

  // 2. Ambil body request dan ubah menjadi string JSON.stringify
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  // Hitung HMAC-SHA256
  const computedSignature = crypto
    .createHmac('sha256', hmacSecret)
    .update(rawBody)
    .digest('hex');

  // Validasi kecocokan tanda tangan secara aman (mencegah timing attack)
  let isValid = false;
  try {
    const sigBuffer = Buffer.from(signature, 'hex');
    const computedBuffer = Buffer.from(computedSignature, 'hex');
    if (sigBuffer.length === computedBuffer.length) {
      isValid = crypto.timingSafeEqual(sigBuffer, computedBuffer);
    }
  } catch (e) {
    isValid = false;
  }

  if (!isValid) {
    return res.status(401).json({ error: 'Unauthorized: Invalid HMAC signature' });
  }

  // Parse data payload
  const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const statusAncaman = data.status || 'bahaya'; // Contoh nilai: 'aman' atau 'bahaya'

  // 3. Integrasi Telegram Bot Alert
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (botToken && chatId) {
    const textMessage = `🚨 *LAPORAN ANCAMAN KEAMANAN* 🚨\n\nStatus: *${statusAncaman.toUpperCase()}*\nDetail: ${JSON.stringify(data, null, 2)}`;
    
    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: textMessage,
          parse_mode: 'Markdown'
        })
      });
    } catch (err) {
      console.error('Gagal mengirim notifikasi ke Telegram:', err);
    }
  }

  return res.status(200).json({ 
    success: true, 
    message: 'Webhook terautentikasi dan diproses dengan sukses',
    status: statusAncaman 
  });
}