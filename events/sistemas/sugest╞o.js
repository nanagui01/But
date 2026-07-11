const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder} = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbp = new JsonDatabase({ databasePath: "./json/perms.json"})
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json"})
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json"})
const Discord = require("discord.js")
module.exports = {
    name: "messageCreate",
    run: async (message) => {
        if (message.author.bot) return;
        if (dbc.get(`sugest.sistema`) !== "ON") return;
      
        // Buscar a mensagem específica e reagir a ela
        const channelId = dbc.get(`sugest.channel`)
        if (message.channel.id === channelId) {
            await message.react(dbc.get(`sugest.certo`))
            await message.react(dbc.get(`sugest.errado`))
            const user = message.author;
            // Crie um tópico a partir da mensagem
            const thread = await message.startThread({
                name: `Sugestão de ${user.displayName}`,
                autoArchiveDuration: 10080, // duração em minutos (60, 1440, 4320, 10080)
                reason: `Sugestão de ${user.displayName}`
            });
        
            // Envie uma mensagem para o tópico
            await thread.send(`Olá ${user} 👋, obrigado por enviar sua sugestão!`);
        }
    }
}