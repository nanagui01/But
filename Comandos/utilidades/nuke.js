const Discord = require("discord.js");
const { JsonDatabase } = require("wio.db");

const dbe = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json" });

module.exports = {
    name: `nuke`,
    description: `🤖 | Recrie o chat atual.`,
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        // Defer para ganhar tempo e evitar timeout
        await interaction.deferReply({ ephemeral: true }).catch(err => {
            console.error(`[NUKE] Erro ao deferir:`, err);
            return;
        });

        try {
            // Verificação de permissão
            if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageChannels)) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Você não tem permissão para usar este comando!`
                });
            }

            // Mensagem de aguarde
            const emojiLoading = dbe.get(`16`) || '⏳';
            await interaction.editReply({ content: `${emojiLoading} | Aguarde um momento..` });

            const channel = interaction.channel;
            const channelPosition = channel.position;

            // Clona o canal
            const newChannel = await channel.clone();

            // Deleta o canal original (a interação ainda existe, mas não podemos editar a reply depois disso facilmente)
            await channel.delete();

            // Reposiciona o novo canal
            await newChannel.setPosition(channelPosition);

            // Envia confirmação no novo canal
            const emojiSucesso = dbe.get(`6`) || '✅';
            const confirmMessage = await newChannel.send(
                `${emojiSucesso} | Canal nukado por ${interaction.user} (\`${interaction.user.username} - ${interaction.user.id}\`)!`
            );

            // Auto-deleta a mensagem de confirmação após 20s
            setTimeout(() => {
                confirmMessage.delete().catch(() => {});
            }, 20000);

        } catch (error) {
            console.error(`[NUKE] Erro na execução:`, error);
            // Tenta responder com erro (a interação pode ainda estar disponível se o canal não foi deletado)
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content: `❌ | Ocorreu um erro ao recriar o canal. Verifique minhas permissões.`
                    });
                } else {
                    await interaction.followUp({
                        content: `❌ | Erro inesperado.`,
                        ephemeral: true
                    });
                }
            } catch (replyErr) {
                console.error(`[NUKE] Falha ao enviar mensagem de erro:`, replyErr);
            }
        }
    }
};