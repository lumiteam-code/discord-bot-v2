const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.json());

// TẠO BOT (thêm intent để detect user join)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers // QUAN TRỌNG
  ]
});

// LOGIN BOT
client.login(process.env.BOT_TOKEN);


// ====== CONFIG ======
const CATEGORY_NAME = "TASK BOT"; // tên folder chứa channel

// ====== BOT READY ======
client.on("ready", () => {
  console.log("✅ Bot đã online");
});

// ====== TẠO / LẤY CATEGORY ======
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

// ====== TẠO CHANNEL RIÊNG CHO USER ======
async function createPrivateChannel(guild, user) {
  const category = await getOrCreateCategory(guild);

  const channelName = `task-${user.username}`.toLowerCase();

  // check nếu đã có rồi
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
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      }
    ]
  });

  return channel;
}

// ====== KHI USER JOIN SERVER ======
client.on("guildMemberAdd", async (member) => {
  try {
    console.log("User join:", member.user.username);

    await createPrivateChannel(member.guild, member.user);

  } catch (err) {
    console.error("Lỗi tạo channel:", err);
  }
});

// ====== API NHẬN TASK ======
app.post("/notify", async (req, res) => {
  try {
    const { userId, task } = req.body;

    console.log("Nhận task:", task);

    const guild = client.guilds.cache.first();
    const user = await client.users.fetch(userId);

    if (!guild || !user) {
      return res.status(400).send("Không tìm thấy user hoặc guild");
    }

    const channel = await createPrivateChannel(guild, user);

    await channel.send(`🆕 Task mới của bạn:\n👉 ${task}`);

    res.send("OK");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

// ====== CHẠY SERVER ======
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server chạy port ${PORT}`);
});
