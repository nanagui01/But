const Discord = require("discord.js");
const { JsonDatabase } = require("wio.db");

const dbe = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json" });

module.exports = {
    name: `unlock`,
    description: `🤖 | Destranque o chat.`,
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        // Defer para evitar timeout e garantir resposta
        await interaction.deferReply({ ephemeral: false }).catch(err => {
            console.error(`[UNLOCK] Erro ao deferir:`, err);
            return;
        });

        try {
            // Verifica permissão do membro
            if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageChannels)) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Você não tem permissão para usar este comando!`
                });
            }

            // Mensagem de carregamento (editReply após defer)
            const emojiLoading = dbe.get(`16`) || '⏳';
            await interaction.editReply({ content: `${emojiLoading} | Aguarde um momento..` });

            // Libera o canal para @everyone
            await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
                SendMessages: true
            });

            // (Opcional) também libera para o autor (redundante, mas mantido da lógica original)
            await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
                SendMessages: true
            });

            // Resposta final
            const emojiSucesso = dbe.get(`6`) || '✅';
            const embed = new Discord.EmbedBuilder()
                .setAuthor({ name: `${interaction.user.displayName} abriu o canal!`, iconURL: interaction.user.displayAvatarURL() })
                .setColor(dbc.get(`color`) || 0x2b2d31)
                .setDescription(`- O usuário ${interaction.user} deu o comando \`/unlock\`, então eu resolvi abrir o canal. 😉`)
                .setTimestamp()
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

            await interaction.editReply({
                content: `${emojiSucesso} | Canal desbloqueado com sucesso!`,
                embeds: [embed]
            });

        } catch (error) {
            console.error(`[UNLOCK] Erro na execução:`, error);
            // Tenta responder com mensagem amigável
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content: `❌ | Ocorreu um erro ao desbloquear o canal. Verifique minhas permissões.`
                    });
                } else {
                    await interaction.followUp({
                        content: `❌ | Erro inesperado.`,
                        ephemeral: true
                    });
                }
            } catch (replyErr) {
                console.error(`[UNLOCK] Falha ao enviar mensagem de erro:`, replyErr);
            }
        }
    }
};