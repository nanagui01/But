const Discord = require("discord.js");
const { JsonDatabase } = require("wio.db");

const dbe = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json" });

module.exports = {
    name: `lock`,
    description: `🤖 | Tranque o chat.`,
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        // Defer para evitar timeout e garantir resposta
        await interaction.deferReply({ ephemeral: false }).catch(err => {
            console.error(`[LOCK] Erro ao deferir:`, err);
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

            // Bloqueia o canal para @everyone e libera para o autor
            await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
                SendMessages: false
            });
            await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
                SendMessages: true
            });

            // Resposta final
            const emojiSucesso = dbe.get(`6`) || '✅';
            const embed = new Discord.EmbedBuilder()
                .setAuthor({ name: `${interaction.user.displayName} fechou o canal!`, iconURL: interaction.user.displayAvatarURL() })
                .setColor(dbc.get(`color`) || 0x2b2d31)
                .setDescription(`- O usuário ${interaction.user} deu o comando \`/lock\`, então eu resolvi fechar o canal. 😎`)
                .setTimestamp()
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

            await interaction.editReply({
                content: `${emojiSucesso} | Canal bloqueado com sucesso!`,
                embeds: [embed]
            });

        } catch (error) {
            console.error(`[LOCK] Erro na execução:`, error);
            // Tenta responder com mensagem amigável
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content: `❌ | Ocorreu um erro ao bloquear o canal. Verifique se tenho permissão de gerenciar canais.`
                    });
                } else {
                    await interaction.followUp({
                        content: `❌ | Erro inesperado.`,
                        ephemeral: true
                    });
                }
            } catch (replyErr) {
                console.error(`[LOCK] Falha ao enviar mensagem de erro:`, replyErr);
            }
        }
    }
};