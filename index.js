app.post("/notify", async (req, res) => {
  try {
    const { userId, task } = req.body;

    console.log("API HIT:", userId, task);

    // 🔥 FIX: dùng GUILD ID
    const guild = await client.guilds.fetch("1489344554480963710");

    const member = await guild.members.fetch(userId);

    if (!member) {
      return res.status(400).send("User không nằm trong server");
    }

    const channel = await createPrivateChannel(guild, member.user);

    // 👉 bạn muốn bỏ text thì để vậy
    await channel.send(task || " ");

    res.send("OK");

  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).send(err.message);
  }
});
