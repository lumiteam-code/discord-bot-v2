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

// ===== TẠO BOT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.login(process.env.BOT_TOKEN);

// ===== BOT ONLINE =====
client.on("ready", async () => {
  console.log("✅ Bot đã online");

  // 🔥 FIX 1: preload member cache
  const guild = await client.guilds.fetch(GUILD_ID);
  await guild.members.fetch();

  console.log("✅ Loaded members cache");
});

// ===== TẠO CATEGORY =====
async function getOrCreateCategory(guild) {

  // 🔥 FIX 2: fetch channels thay vì cache
  const channels = await guild.channels.fetch();

  let category = channels.find(
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

// ===== TẠO CHANNEL CHO USER =====
async function createPrivateChannelForUser(member) {

  const guild = member.guild;

  const category = await getOrCreateCategory(guild);

  // 🔥 FIX 3: dùng userId thay vì username
  const channelName = `lumi_bot_${member.id}`;

  const channels = await guild.channels.fetch();

  let existing = channels.find(
    c => c.name === channelName
  );

  if (existing) return existing;

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

// ===== KHI USER JOIN =====
client.on("guildMemberAdd", async (member) => {
  try {
    console.log("🔥 USER JOIN:", member.user.tag);

    const channel = await createPrivateChannelForUser(member);

    console.log("✅ Created channel:", channel.name);

  } catch (err) {
    console.error("❌ ERROR CREATE CHANNEL:", err);
  }
});

// ===== API =====
app.post("/notify", async (req, res) => {
  try {
    const { userId, task } = req.body;

    const guild = await client.guilds.fetch(GUILD_ID);

    // 🔥 FIX 4: fetch member chắc chắn
    const member = await guild.members.fetch(userId).catch(() => null);

    if (!member) {
      return res.status(404).send("User không tồn tại");
    }

    const channelName = `lumi_bot_${member.id}`;

    const channels = await guild.channels.fetch();

    let channel = channels.find(
      c => c.name === channelName
    );

    // 🔥 nếu chưa có → tạo luôn
    if (!channel) {
      channel = await createPrivateChannelForUser(member);
    }

    await channel.send(task);

    res.send("OK");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server chạy port ${PORT}`);
});
