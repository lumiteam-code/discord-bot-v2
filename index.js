const { 
  Client, 
  GatewayIntentBits, 
  ChannelType, 
  PermissionsBitField 
} = require('discord.js');

const express = require('express');

const app = express();
app.use(express.json());

// ===== CONFIG =====
const GUILD_ID = "1489344554480963710";
const CATEGORY_NAME = "LUMI BOT";

// ===== DEBUG START =====
console.log("🚀 Đang khởi động bot...");

// ===== TẠO BOT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ===== LOGIN =====
client.login(process.env.BOT_TOKEN)
  .then(() => {
    console.log("🔑 Login thành công");
  })
  .catch(err => {
    console.error("❌ Lỗi login:", err);
  });

// ===== READY =====
client.on("ready", () => {
  console.log(`✅ Bot đã online: ${client.user.tag}`);
});

// ===== ERROR =====
client.on("error", (err) => {
  console.error("❌ Client error:", err);
});

// ===== TẠO CATEGORY =====
async function getOrCreateCategory(guild) {
  let category = guild.channels.cache.find(
    c => c.name === CATEGORY_NAME && c.type === ChannelType.GuildCategory
  );

  if (!category) {
    console.log("📁 Tạo category mới...");
    category = await guild.channels.create({
      name: CATEGORY_NAME,
      type: ChannelType.GuildCategory
    });
  }

  return category;
}

// ===== TẠO CHANNEL =====
async function createPrivateChannelForUser(member) {
  const guild = member.guild;

  const category = await getOrCreateCategory(guild);

  const channelName = `lumi_bot_${member.user.username.toLowerCase()}`;

  let existing = guild.channels.cache.find(c => c.name === channelName);

  if (existing) return existing;

  console.log("🆕 Tạo channel cho:", member.user.username);

  const channel = await guild.channels.create({
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
        allow: [PermissionsBitField.Flags.ViewChannel],
        deny: [PermissionsBitField.Flags.SendMessages]
      },
      {
        id: client.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      }
    ]
  });

  return channel;
}

// ===== USER JOIN =====
client.on("guildMemberAdd", async (member) => {
  console.log("👤 User join:", member.user.username);

  try {
    await createPrivateChannelForUser(member);
  } catch (err) {
    console.error("❌ Lỗi tạo channel:", err);
  }
});

// ===== API =====
app.post("/notify", async (req, res) => {
  try {
    const { userId, task } = req.body;

    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(userId);

    if (!member) {
      return res.status(404).send("User không tồn tại");
    }

    const channelName = `lumi_bot_${member.user.username.toLowerCase()}`;

    let channel = guild.channels.cache.find(c => c.name === channelName);

    if (!channel) {
      channel = await createPrivateChannelForUser(member);
    }

    await channel.send(task);

    res.send("OK");

  } catch (err) {
    console.error("❌ API error:", err);
    res.status(500).send("Error");
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🌐 Server chạy port ${PORT}`);
});
