const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

console.log("🚀 START FILE");

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(PORT, () => {
  console.log("🌐 Server chạy port " + PORT);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 👇 LOG TRẠNG THÁI KẾT NỐI
client.on("ready", () => {
  console.log("✅ BOT ONLINE:", client.user.tag);
});

client.on("error", (err) => {
  console.error("❌ CLIENT ERROR:", err);
});

client.on("debug", (msg) => {
  console.log("🐞 DEBUG:", msg);
});

// 👇 LOGIN
client.login(process.env.BOT_TOKEN)
  .then(() => {
    console.log("🔑 ĐÃ GỌI LOGIN");
  })
  .catch(err => {
    console.error("💥 LOGIN FAIL:", err);
  });
