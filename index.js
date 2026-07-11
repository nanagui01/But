
const Discord = require("discord.js")
const config = require("./token.json")
const client = new Discord.Client({ 
  intents: [ 
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent,
    Discord.GatewayIntentBits.GuildMembers,
    '32767'
       ]
    });

module.exports = client
console.clear()
client.on('interactionCreate', (interaction) => {

  if(interaction.type === Discord.InteractionType.ApplicationCommand){

      const cmd = client.slashCommands.get(interaction.commandName);

      if (!cmd) return interaction.reply(`Error`);

      interaction["member"] = interaction.guild.members.cache.get(interaction.user.id);

      cmd.run(client, interaction)

   }
})
client.on('guildCreate', guild => {
  console.log(`Bot entrou em um novo servidor: ${guild.name}.`);
  if (client.guilds.cache.size > 1) {
      guild.leave()
          .then(() => console.log(`Saiu do servidor ${guild.name}`))
          .catch(console.error);
  }
});
client.on("interactionCreate", async interaction => {
  if(interaction.isAutocomplete()) {
    const command = client.slashCommands.get(interaction.commandName)
    if(!command) {
      return;
    }
    

    try{
      await command.autocomplete(interaction);
    }catch(err){return;}
  }
});

client.slashCommands = new Discord.Collection()

client.login(config.token)
const events = require("./handler/events")
const slash = require("./handler/slash")
slash.run(client)
events.run(client)




  process.on('multipleResolutions', (type, reason, promise) => {
    console.log(`Err:\n` + type, promise, reason);
  });
  process.on('unhandledRejection', (reason, promise) => {
    console.log(`Err:\n` + reason, promise);
  });
  process.on('uncaughtException', (error, origin) => {
    console.log(`Err:\n` + error, origin);
  });
  process.on('uncaughtExceptionMonitor', (error, origin) => {
    console.log(`Err:\n` + error, origin);
   });
  
  
  