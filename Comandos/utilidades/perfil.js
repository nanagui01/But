const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, Attachment, AttachmentBuilder} = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json"})
const dc = new JsonDatabase({ databasePath: "./json/carrinho.json"})
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json"})
const dbp = new JsonDatabase({ databasePath: "./json/personalizados.json"})
const db = new JsonDatabase({ databasePath: "./json/produtos.json"})
const dbr = new JsonDatabase({ databasePath: "./json/rendimentos.json"})
const dbru = new JsonDatabase({ databasePath: "./json/rankUsers.json"})
const dbrp = new JsonDatabase({ databasePath: "./json/rankProdutos.json"})
const dbcp = new JsonDatabase({ databasePath: "./json/perfil.json"})
const fs = require("fs")
const Discord = require("discord.js")
const moment = require("moment")

module.exports = {
    name: "perfil", 
    description:"🤖 | Veja o seu perfil ou de outro usúario",
    type:Discord.ApplicationCommandType.ChatInput,
    options: [
        {
            name:"user",
            description:"Escolha algum usuario!",
            type:Discord.ApplicationCommandOptionType.User,
            required: false
        }
    ],
    run: async(client, interaction, message, args) => {
        const usuario = interaction.options.getUser("user") || interaction.user
        if (usuario.id === interaction.user.id) {
            const id = interaction.user.id
            const embed = new Discord.EmbedBuilder()
            .setAuthor({ name: `Perfil de ${usuario.displayName}!`, iconURL: usuario.displayAvatarURL()})
            .addFields(
                { name: `Compras:`, value: `${dbcp.get(`${id}.comprasrealizadas`) || "0"} Compras realizadas.`, inline:true },
                { name: `Dinheiro gasto:`, value: `R$${Number(dbcp.get(`${id}.valoresganhos`)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0"}`, inline:true },
            )
            .setColor(dbc.get(`color`) || "Default")
            .setThumbnail(usuario.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({})})
            interaction.reply({embeds: [embed], ephemeral:true})
        } else {
            const id = usuario.id
            const embed = new Discord.EmbedBuilder()
            .setAuthor({ name: `Perfil de ${usuario.displayName}!`, iconURL: usuario.displayAvatarURL()})
            .addFields(
                { name: `Quantidades de compras:`, value: `${dbcp.get(`${id}.comprasrealizadas`) || "0"} Compras realizadas.`, inline:true },
                { name: `Dinheiro gasto:`, value: `R$${Number(dbcp.get(`${id}.valoresganhos`)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            )
            .setColor(dbc.get(`color`) || "Default")
            .setThumbnail(usuario.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({})})
            interaction.reply({embeds: [embed], ephemeral:true})
        }
    }
}