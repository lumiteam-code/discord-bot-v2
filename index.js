const { 
  Client, 
  GatewayIntentBits 
} = require('discord.js');

const express = require('express');

const app = express();
app.use(express.json());

// ===== CONFIG =====
const GUILD_ID = "1489344554480963710";

// ===== BOT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

client.login(process.env.BOT_TOKEN);

// ===== BOT READY =====
client.on("ready", () => {
  console.log(`✅ Bot đã online: ${client.user.tag}`);
});

// ===== API SEND MESSAGE =====
app.post("/notify", async (req, res) => {

  try {

    const { channelId, task } = req.body;

    if (!channelId || !task) {
      return res.status(400).send("Thiếu channelId hoặc task");
    }

    if (!client.isReady()) {
      return res.status(503).send("Bot chưa sẵn sàng");
    }

    // ===== FETCH CHANNEL =====
    const channel = await client.channels.fetch(channelId).catch(() => null);

    if (!channel) {
      return res.status(404).send("Không tìm thấy channel");
    }

    // ===== SEND MESSAGE =====
    await channel.send(task);

    console.log(`📨 Sent to ${channelId}`);

    res.send("OK");

  } catch (err) {

    console.error("❌ ERROR:", err);

    res.status(500).send("Error");
  }

});


// ===== HEALTH CHECK (CHO RENDER / UPTIME) =====
app.get("/", (req, res) => {
  res.send("Bot is running 🚀");
});


// ===== START SERVER =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server chạy port ${PORT}`);
});
