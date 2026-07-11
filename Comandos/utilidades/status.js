
const Discord = require("discord.js")
const { EmbedBuilder, ModalBuilder, TextInputBuilder, ActionRowBuilder} = require("discord.js")

module.exports = {
    name: `status`,
    description: `🤖 | Mude os meus status.`,
    type: Discord.ApplicationCommandType.ChatInput,

    run: async(client, interaction) => {
        const modal = new ModalBuilder()
        .setTitle("Alterar Status do seu BOT")
        .setCustomId("modalconfigstatus");

        const text = new TextInputBuilder()
        .setCustomId("presence")
        .setRequired(true)
        .setPlaceholder("Online, Ausente, Invisivel ou Ocupado")
        .setLabel("ESCOLHA O TIPO DE PRESENÇA:")
        .setStyle(1);

        const text1 = new TextInputBuilder()
        .setCustomId("atividade")
        .setRequired(true)
        .setPlaceholder("Jogando, Assistindo, Competindo, Transmitindo, Ouvindo")
        .setLabel("ESCOLHA O TIPO DE ATIVIDADE:")
        .setStyle(1);

        const text2 = new TextInputBuilder()
        .setCustomId("text_ativd")
        .setRequired(true)
        .setPlaceholder("Digite aqui")
        .setLabel("ESCREVA O TEXTO DA ATIVIDADE:")
        .setStyle(1);

        const text3 = new TextInputBuilder()
        .setCustomId("url")
        .setRequired(false)
        .setLabel("URL DO CANAL:")
        .setPlaceholder("Se a escolha foi Transmitindo, Coloque a Url aqui, ex: https://www.twitch.tv/discord")
        .setStyle(2);

        modal.addComponents(new ActionRowBuilder().addComponents(text));
        modal.addComponents(new ActionRowBuilder().addComponents(text1));
        modal.addComponents(new ActionRowBuilder().addComponents(text2));
        modal.addComponents(new ActionRowBuilder().addComponents(text3));

        await interaction.showModal(modal);
    }
}