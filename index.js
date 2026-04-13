const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');
const express = require('express');

console.log("🚀 START FILE");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ====== DISCORD CLIENT ======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers // cần để detect user join
  ]
});

// ====== LOGIN ======
client.login(process.env.BOT_TOKEN)
  .then(() => console.log("🔑 ĐÃ GỌI LOGIN"))
  .catch(err => console.error("💥 LOGIN FAIL:", err));

// ====== CONFIG ======
const CATEGORY_NAME = "TASK BOT";

// ====== BOT READY ======
client.on("ready", () => {
  console.log("✅ BOT ONLINE:", client.user.tag);
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

// ====== TẠO CHANNEL RIÊNG ======
async function createPrivateChannel(guild, member) {
  const category = await getOrCreateCategory(guild);

  const channelName = `notify_${member.displayName}`.toLowerCase();

  // check nếu đã có
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
        id: guild.members.me.id, // 👈 BOT
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      }
    ]
  });

  console.log("📁 Đã tạo channel:", channel.name);
  console.log("💾 Channel ID:", channel.id);

  return channel;
}

// ====== USER JOIN ======
client.on("guildMemberAdd", async (member) => {
  try {
    console.log("👤 User join:", member.displayName);

    const channel = await createPrivateChannel(member.guild, member);

    await channel.send(`👋 Chào ${member}, đây là channel riêng của bạn!`);

  } catch (err) {
    console.error("❌ Lỗi tạo channel:", err);
  }
});

// ====== API NHẬN TASK ======
app.post("/notify", async (req, res) => {
  try {
    const { channelId, task } = req.body;

    if (!channelId || !task) {
      return res.status(400).send("Thiếu channelId hoặc task");
    }

    const channel = await client.channels.fetch(channelId);

    if (!channel) {
      return res.status(404).send("Không tìm thấy channel");
    }

    

    console.log("📨 Đã gửi task tới:", channelId);

    res.send("OK");

  } catch (err) {
    console.error("❌ Lỗi gửi task:", err);
    res.status(500).send("Error");
  }
});

// ====== SERVER ======
app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(PORT, () => {
  console.log("🌐 Server chạy port " + PORT);
});
