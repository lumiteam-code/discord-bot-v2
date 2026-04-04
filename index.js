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
client.on("ready", () => {
  console.log("✅ Bot đã online");
});

// ===== TẠO CATEGORY NẾU CHƯA CÓ =====
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

// ===== TẠO CHANNEL CHO USER =====
async function createPrivateChannelForUser(member) {
  const guild = member.guild;

  const category = await getOrCreateCategory(guild);

  const channelName = `lumi_bot_${member.user.username.toLowerCase()}`;

  // nếu đã có thì bỏ qua
  let existing = guild.channels.cache.find(
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
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      }
    ]
  });

  return channel;
}

// ===== KHI USER JOIN SERVER =====
client.on("guildMemberAdd", async (member) => {
  try {
    console.log("User join:", member.user.username);

    const channel = await createPrivateChannelForUser(member);

    console.log("Đã tạo channel:", channel.name);

  } catch (err) {
    console.error("Lỗi tạo channel:", err);
  }
});

// ===== API NHẬN TASK =====
app.post("/notify", async (req, res) => {
  try {
    const { userId, task } = req.body;

    const guild = await client.guilds.fetch(GUILD_ID);

    const member = await guild.members.fetch(userId);

    if (!member) {
      return res.status(404).send("User không tồn tại trong server");
    }

    const channelName = `lumi_bot_${member.user.username.toLowerCase()}`;

    let channel = guild.channels.cache.find(
      c => c.name === channelName
    );

    // nếu chưa có thì tạo luôn
    if (!channel) {
      channel = await createPrivateChannelForUser(member);
    }

    // gửi message
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
