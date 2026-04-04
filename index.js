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

  // 👉 DÙNG USER ID (CHUẨN)
  const channelName = `[LUMI]_Notify_${user.username}`.toLowerCase();

  // 👉 FETCH FULL (không dùng cache)
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

    const guild = client.guilds.cache.first();
    const user = await client.users.fetch(userId);

    if (!guild || !user) {
      return res.status(400).send("Không tìm thấy user hoặc guild");
    }

    const channel = await createPrivateChannel(guild, user);

    await channel.send(` `);

    res.send("OK");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server chạy port ${PORT}`);
});
