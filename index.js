const Discord = require("discord.js");
const express = require("express");

// =========================
// SERVIDOR PARA O RENDER
// =========================

const app = express();

app.get("/", (req, res) => {
  res.status(200).send("Bot online!");
});

app.get("/status", (req, res) => {
  res.json({
    online: true,
    bot: "online"
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`🌐 Servidor iniciado na porta ${process.env.PORT || 3000}`);
});


// =========================
// DISCORD CLIENT
// =========================

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent,
    Discord.GatewayIntentBits.GuildMembers,
    32767
  ]
});

module.exports = client;

console.clear();


// =========================
// INTERAÇÕES SLASH
// =========================

client.on("interactionCreate", async (interaction) => {

  if (interaction.type === Discord.InteractionType.ApplicationCommand) {

    const cmd = client.slashCommands.get(interaction.commandName);

    if (!cmd)
      return interaction.reply({
        content: "Comando não encontrado.",
        ephemeral: true
      });

    if (interaction.guild) {
      interaction.member =
        interaction.guild.members.cache.get(interaction.user.id);
    }

    try {
      await cmd.run(client, interaction);
    } catch (err) {
      console.log("Erro no comando:", err);
    }
  }


  if (interaction.isAutocomplete()) {

    const command =
      client.slashCommands.get(interaction.commandName);

    if (!command || !command.autocomplete)
      return;

    try {
      await command.autocomplete(interaction);
    } catch (err) {
      console.log("Erro autocomplete:", err);
    }
  }

});


// =========================
// PROTEÇÃO CONTRA ERROS
// =========================

process.on("multipleResolutions", (type, reason, promise) => {
  console.log("Multiple Resolution:", type, promise, reason);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection:", reason, promise);
});

process.on("uncaughtException", (error, origin) => {
  console.log("Uncaught Exception:", error, origin);
});

process.on("uncaughtExceptionMonitor", (error, origin) => {
  console.log("Exception Monitor:", error, origin);
});


// =========================
// SISTEMAS
// =========================

client.slashCommands = new Discord.Collection();

const events = require("./handler/events");
const slash = require("./handler/slash");

slash.run(client);
events.run(client);


// =========================
// LOGIN
// =========================

client.login(process.env.TOKEN);