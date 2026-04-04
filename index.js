const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.json());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.login(process.env.BOT_TOKEN);

const CATEGORY_NAME = "LUMI BOT";

client.on("ready", () => {
  console.log("✅ Bot đã online");
});

// ===== CATEGORY =====
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

// ===== CHANNEL RIÊNG =====
async function createPrivateChannel(guild, user) {
  const category = await getOrCreateCategory(guild);

  // 🔥 FIX: dùng user.id (KHÔNG BAO GIỜ TRÙNG)
  const channelName = `lumi-${user.id}`;

  const channels = await guild.channels.fetch(1489344554480963710);

  let channel = channels.find(c => c.name === channelName);

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
  try {
    console.log("User join:", member.user.username);

    await createPrivateChannel(member.guild, member.user);

  } catch (err) {
    console.error("Lỗi tạo channel:", err);
  }
});

// ===== API =====
app.post("/notify", async (req, res) => {
try {
const { userId, task } = req.body;
