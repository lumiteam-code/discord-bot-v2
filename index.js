const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');
const express = require('express');

console.log("🚀 START FILE");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ====== CACHE (GIẢM API CALL) ======
const channelCache = new Map();

// ====== DISCORD CLIENT ======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ====== LOGIN ======
client.login(process.env.BOT_TOKEN);

// ====== CONFIG ======
const CATEGORY_NAME = "TASK BOT";

// ====== READY ======
client.once("ready", () => {
  console.log("✅ BOT ONLINE:", client.user.tag);
});

// ====== GET / CREATE CATEGORY (TỐI ƯU) ======
async function getOrCreateCategory(guild) {
  let category = guild.channels.cache.find(
    c => c.name === CATEGORY_NAME && c.type === ChannelType.GuildCategory
  );

  if (category) return category;

  return await guild.channels.create({
    name: CATEGORY_NAME,
    type: ChannelType.GuildCategory
  });
}

// ====== CREATE CHANNEL ======
async function createPrivateChannel(guild, member) {
  const category = await getOrCreateCategory(guild);

  const channelName = `notify_${member.displayName}`.toLowerCase();

  // check cache trước (nhanh hơn)
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
        id: member.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      },
      {
        id: guild.members.me.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      }
    ]
  });

  // lưu cache
  channelCache.set(member.id, channel.id);

  return channel;
}

// ====== USER JOIN ======
client.on("guildMemberAdd", async (member) => {
  try {
    const channel = await createPrivateChannel(member.guild, member);

    // ❌ bỏ welcome nếu muốn tiết kiệm
    // await channel.send(`👋 Chào ${member}, đây là channel riêng của bạn!`);

  } catch (err) {
    console.error("❌ Lỗi tạo channel:", err.message);
  }
});

// ====== API ======
app.post("/notify", async (req, res) => {
  try {
    const { channelId, task } = req.body;

    if (!channelId || !task) {
      return res.status(400).send("Missing data");
    }

    let channel;

    // ưu tiên cache (siêu nhanh, không gọi API)
    if (channelCache.has(channelId)) {
      channel = client.channels.cache.get(channelId);
    }

    // fallback nếu chưa có cache
    if (!channel) {
      channel = await client.channels.fetch(channelId);
    }

    if (!channel) {
      return res.status(404).send("Channel not found");
    }

    await channel.send(task);

    res.send("OK");

  } catch (err) {
    console.error("❌ Send error:", err.message);
    res.status(500).send("Error");
  }
});

// ====== KEEP ALIVE ======
app.get("/", (req, res) => {
  res.send("ok");
});

app.listen(PORT, () => {
  console.log("🌐 Port " + PORT);
});
