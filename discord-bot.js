// discord-bot.js
// Discord bot for Pro Clubs Championship
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');
const axios = require('axios');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN || 'YOUR_DISCORD_TOKEN';
const CLIENT_ID = process.env.CLIENT_ID || 'YOUR_CLIENT_ID';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/proclubs';
const BOT_PORT = process.env.BOT_PORT || 5000;

// --- SECURITY: Use environment variables for all secrets ---
// Example .env file:
// MONGO_URI=mongodb://localhost:27017/proclubs
// DISCORD_TOKEN=your_discord_bot_token
// CLIENT_ID=your_discord_client_id
// BOT_PORT=5000

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected (bot)'))
  .catch(err => console.error('MongoDB connection error (bot):', err));

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
  console.log(`Discord bot logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content === '!ping') {
    message.reply('Pong!');
  }
  // Add more commands as needed
});

client.login(DISCORD_TOKEN);

// --- Discord Bot: Listen for match report events (stub for integration) ---
// This is a simple polling approach. For production, use a message queue or event system.
const botApp = express();
botApp.use(express.json());

botApp.post('/bot/report-match', async (req, res) => {
  const { matchId } = req.body;
  // Here, the bot would fetch match info from DB and post to Discord
  // For demo, just log and respond
  console.log(`[Discord Bot] Reporting match:`, matchId);
  // TODO: Implement actual Discord channel message logic
  res.json({ message: `Match ${matchId} reported to Discord (bot stub).` });
});

// --- Advanced: Listen for match report events from backend ---
// Example: poll for new match reports in DB (replace with real logic)
// setInterval(async () => {
//   // Fetch new match reports from DB and post to Discord
// }, 10000);

// --- Advanced: Post to Discord channel (stub) ---
async function postMatchReportToDiscord(matchId) {
  // TODO: Fetch match info from DB and send a message to a Discord channel
  // Example:
  // const channel = await client.channels.fetch('YOUR_CHANNEL_ID');
  // channel.send(`Match ${matchId} has been reported!`);
}

botApp.listen(BOT_PORT, () => console.log(`Discord bot webhook listening on port ${BOT_PORT}`));
