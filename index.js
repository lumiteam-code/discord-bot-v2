const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🚀 CHẠY SERVER TRƯỚC (QUAN TRỌNG)
app.listen(PORT, () => {
  console.log(`🚀 Server chạy port ${PORT}`);
});

// ===== DISCORD BOT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const CATEGORY_NAME = "LUMI BOT";
const GUILD_ID = "1489344554480963710"; // 👈 THAY

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

// ===== CHANNEL =====
async function createPrivateChannel(guild, user) {
  const category = await getOrCreateCategory(guild);

  const channelName = `lumi-${user.id}`;

  const channels = await guild.channels.fetch();

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
    await createPrivateChannel(member.guild, member.user);
  } catch (err) {
    console.error(err);
  }
});

// ===== API =====
app.post("/notify", async (req, res) => {
  try {
    const { userId, task } = req.body;

    console.log("API HIT:", userId, task);

    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(userId);

    const channel = await createPrivateChannel(guild, member.user);

    await channel.send(task || " ");

    res.send("OK");

  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).send(err.message);
  }
});

// 🚀 LOGIN BOT (ĐỂ SAU CÙNG)
client.login(process.env.BOT_TOKEN);
