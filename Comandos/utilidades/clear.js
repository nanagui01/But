const Discord = require("discord.js");
const { JsonDatabase } = require("wio.db");
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dbp = new JsonDatabase({ databasePath: "./json/perms.json" });

module.exports = {
    name: "clear",
    description: `🤖 | Limpe o chat atual.`,
    type: Discord.ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'quantidade',
            description: 'Número de mensagens que serão apagadas.',
            type: Discord.ApplicationCommandOptionType.Number,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageChannels))
            return interaction.reply({ ephemeral: true, content: `${dbe.get(`13`)} | Você não tem permissão para usar este comando!` });

        let numero = Number(interaction.options.getNumber('quantidade'));
        if (isNaN(numero) || numero > 2000 || numero <= 0) {
            return interaction.reply({ ephemeral: true, content: `${dbe.get(`13`)} | O comando só apaga entre \`1 - 2000\` mensagens!` });
        }

        await interaction.deferReply({ ephemeral: true });

        let deletedCount = 0;
        let failedToDelete = 0;

        async function deleteMsg() {
            try {
                let messages = await interaction.channel.messages.fetch({ limit: Math.min(100, numero) });
                if (!messages.size) {
                    return interaction.editReply({
                        content: `${dbe.get(`6`)} | **${deletedCount}** mensagens excluídas do chat.${failedToDelete > 0 ? `\n${dbe.get("2")} | Algumas mensagens não puderam ser apagadas por serem muito antigas.` : ''}`
                    });
                }

                let filteredMessages = messages.filter(msg => (Date.now() - msg.createdTimestamp) < 1209600000);
                failedToDelete += messages.size - filteredMessages.size;
                
                let deleted = await interaction.channel.bulkDelete(filteredMessages, true);
                deletedCount += deleted.size;
                numero -= deleted.size;

                if (numero > 0 && deleted.size > 0) {
                    setTimeout(deleteMsg, 500);
                } else {
                    return interaction.editReply({
                        content: `${dbe.get(`6`)} | **${deletedCount}** mensagens foram excluídas do chat.${failedToDelete > 0 ? `\n${dbe.get("2")} | Algumas mensagens não puderam ser apagadas por serem muito antigas.` : ''}`,
                        ephemeral: true
                    });
                }
            } catch (err) {
                console.error("Erro ao apagar mensagens:", err);
                return interaction.editReply({
                    content: `${dbe.get(`13`)} | Ocorreu um erro ao apagar mensagens! Algumas podem ser antigas demais ou ocorreu um erro interno.`,
                    ephemeral: true
                });
            }
        }
        deleteMsg();
    }
};
