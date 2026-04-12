const { Client, GatewayIntentBits } = require('discord.js');

console.log("🚀 START FILE");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on("ready", () => {
  console.log("✅ BOT ONLINE:", client.user.tag);
});

client.login(process.env.BOT_TOKEN);
