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
        // Defer para evitar timeout e garantir ephemeral
        await interaction.deferReply({ ephemeral: true }).catch(err => {
            console.error(`[CLEAR] Erro ao deferir:`, err);
            return;
        });

        try {
            // Permissão: apenas usuários com ManageChannels
            if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageChannels)) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Você não tem permissão para usar este comando!`
                });
            }

            const numero = interaction.options.getNumber('quantidade');
            if (isNaN(numero) || numero > 2000 || numero <= 0) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | O comando só apaga entre \`1 - 2000\` mensagens!`
                });
            }

            let restante = numero;
            let deletadas = 0;
            let falhas = 0;

            // Função assíncrona recursiva para lotes de 100
            const deletarLote = async () => {
                try {
                    const limit = Math.min(100, restante);
                    const messages = await interaction.channel.messages.fetch({ limit });

                    if (!messages.size) {
                        // Sem mais mensagens para apagar
                        const sucessoEmoji = dbe.get(`6`) || '✅';
                        const avisoEmoji = dbe.get("2") || '⚠️';
                        let msg = `${sucessoEmoji} | **${deletadas}** mensagens excluídas do chat.`;
                        if (falhas > 0) msg += `\n${avisoEmoji} | Algumas mensagens não puderam ser apagadas por serem muito antigas.`;
                        return await interaction.editReply({ content: msg });
                    }

                    // Filtra mensagens com menos de 14 dias (limite do bulkDelete)
                    const validas = messages.filter(msg => (Date.now() - msg.createdTimestamp) < 1209600000);
                    falhas += messages.size - validas.size;

                    if (validas.size > 0) {
                        const deleted = await interaction.channel.bulkDelete(validas, true);
                        deletadas += deleted.size;
                        restante -= deleted.size;
                    }

                    if (restante > 0 && validas.size > 0) {
                        // Aguarda 500ms para próximo lote
                        await new Promise(resolve => setTimeout(resolve, 500));
                        return await deletarLote();
                    } else {
                        const sucessoEmoji = dbe.get(`6`) || '✅';
                        const avisoEmoji = dbe.get("2") || '⚠️';
                        let msg = `${sucessoEmoji} | **${deletadas}** mensagens foram excluídas do chat.`;
                        if (falhas > 0) msg += `\n${avisoEmoji} | Algumas mensagens não puderam ser apagadas por serem muito antigas.`;
                        return await interaction.editReply({ content: msg });
                    }
                } catch (err) {
                    console.error(`[CLEAR] Erro durante exclusão:`, err);
                    const emojiErro = dbe.get(`13`) || '❌';
                    return await interaction.editReply({
                        content: `${emojiErro} | Ocorreu um erro ao apagar mensagens! Algumas podem ser antigas demais ou ocorreu um erro interno.`
                    }).catch(() => {});
                }
            };

            await deletarLote();

        } catch (error) {
            console.error(`[CLEAR] Erro na execução:`, error);
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content: `❌ | Ocorreu um erro interno ao executar a limpeza. Tente novamente.`
                    });
                } else {
                    await interaction.followUp({
                        content: `❌ | Erro inesperado.`,
                        ephemeral: true
                    });
                }
            } catch (replyErr) {
                console.error(`[CLEAR] Falha ao enviar mensagem de erro:`, replyErr);
            }
        }
    }
};