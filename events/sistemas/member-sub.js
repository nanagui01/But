const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder} = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbp = new JsonDatabase({ databasePath: "./json/personalizados.json"})
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json"})
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json"})
const Discord = require("discord.js")
const db = new JsonDatabase({ databasePath: "./json/produtos.json"})
const dbep = new JsonDatabase({ databasePath: "./json/emojisGlob.json"})
module.exports = {
    name: "guildMemberRemove",
    run: async (client) => {
        const canal = client.guild.channels.cache.get(dbc.get("logs.entrada.saiu"))
        if (canal) {
            const member = client
            const nomeUsuario = member.user.username;
            const dataCriacao = new Date(member.user.createdAt.setHours(0, 0, 0, 0));
            const dataAtual = new Date();
            const diffEmMilissegundos = Math.abs(dataAtual - dataCriacao);
            const diffEmDias = Math.floor(diffEmMilissegundos / (1000 * 60 * 60 * 24));
            const tempoNoDiscord = `${diffEmDias} dias no Discord.`;
            const embed = new EmbedBuilder()
            .setAuthor({ name: `Saida de Membro!`, iconURL: member.user.displayAvatarURL()})
            .setThumbnail(member.user.displayAvatarURL())
            .setColor("Red")
            .setFields(
                { name: `Usuário:`, value: `\`${member.user.username} - ${member.user.id}\``, inline:true },
                { name: `Tempo da conta:`, value: `${tempoNoDiscord}`, inline:true },
            )
            .setFooter({ text: `Servidor: ${client.guild.name}` })
            .setTimestamp()
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("teste")
                    .setDisabled(true)
                    .setStyle(2)
                    .setLabel("Mensagem Automática")
                    .setEmoji(dbep.get(`5`))
            );
            canal.send({ content: `${client.user}`, embeds: [embed], components: [row]})
        }
    }
}