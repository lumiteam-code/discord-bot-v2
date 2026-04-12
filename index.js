const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

console.log("🚀 START FILE");

const app = express();

// 🔥 MỞ PORT để Render không kill
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🌐 Server chạy port", PORT);
});

// ===== DISCORD BOT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on("ready", () => {
  console.log("✅ BOT ONLINE:", client.user.tag);
});

client.login(process.env.BOT_TOKEN);
