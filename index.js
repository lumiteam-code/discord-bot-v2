const https = require("https");
const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');
const express = require('express');

console.log("🚀 START FILE");

// ===== TEST NETWORK =====
https.get("https://discord.com/api/v10/gateway", (res) => {
  console.log("🌍 STATUS:", res.statusCode);
});

// ===== EXPRESS =====
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(PORT, () => {
  console.log("🌐 Server chạy port " + PORT);
});

// ===== DISCORD CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers // 👈 BẮT BUỘC
  ]
});

// ===== CONFIG =====
const CATEGORY_NAME = "TASK BOT";

// ===== READY =====
client.on("ready", () => {
  console.log("✅ BOT ONLINE:", client.user.tag);
});

// ===== CREATE CATEGORY =====
async function getOrCreateCategory(guild) {
  let category = guild.channels.cache.find(
    c => c.name === CATEGORY_NAME && c.type === ChannelType.GuildCategory
  );

  if (!category) {
    category = await guild.channels.create({
      name: CATEGORY_NAME,
      type: ChannelType.GuildCategory
    });
  }

  return category;
}

// ===== CREATE PRIVATE CHANNEL =====
async function createPrivateChannel(guild, user) {
  const category = await getOrCreateCategory(guild);

  const channelName = `task-${user.username}`.toLowerCase();

  let channel = guild.channels.cache.find(c => c.name === channelName);
  if (channel) return channel;

  channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: user.id,
        allow: [PermissionsBitField.Flags.ViewChannel],
        deny: [PermissionsBitField.Flags.SendMessages] // 👈 chỉ xem
      }
    ]
  });

  return channel;
}

// ===== USER JOIN =====
client.on("guildMemberAdd", async (member) => {
  try {
    console.log("👤 User join:", member.user.username);
    await createPrivateChannel(member.guild, member.user);
  } catch (err) {
    console.error("❌ Lỗi tạo channel:", err);
  }
});

// ===== API =====
app.post("/notify", async (req, res) => {
  try {
    const { userId, task } = req.body;

    const guild = client.guilds.cache.first();
    const user = await client.users.fetch(userId);

    if (!guild || !user) {
      return res.status(400).send("Không tìm thấy user hoặc guild");
    }

    const channel = await createPrivateChannel(guild, user);

    await channel.send(`🆕 Task mới:\n👉 ${task}`);

    res.send("OK");

  } catch (err) {
    console.error("❌ API ERROR:", err);
    res.status(500).send("Error");
  }
});

// ===== LOGIN =====
client.login(process.env.BOT_TOKEN)
  .then(() => console.log("🔑 ĐÃ GỌI LOGIN"))
  .catch(err => console.error("💥 LOGIN FAIL:", err));
