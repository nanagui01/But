const { JsonDatabase } = require("wio.db");
const Discord = require("discord.js");
const { joinVoiceChannel } = require('@discordjs/voice');

const dbe = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dbp = new JsonDatabase({ databasePath: "./json/perms.json" });

module.exports = {
    name: `conectar`,
    description: `🤖 | Conecte o bot em uma call.`,
    type: Discord.ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'canal',
            description: 'Selecione o canal de voz para conectar o bot',
            type: Discord.ApplicationCommandOptionType.Channel,
            required: true,
            channel_types: [Discord.ChannelType.GuildVoice]
        }
    ],

    run: async (client, interaction) => {
        // Defer para garantir tempo de resposta e interação ephemeral
        await interaction.deferReply({ ephemeral: true }).catch(err => {
            console.error(`[CONECTAR] Erro ao deferir:`, err);
            return;
        });

        try {
            // Verificação de permissão corrigida (apenas usuários cadastrados no banco)
            if (!dbp.has(interaction.user.id)) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Você não tem permissão para usar este comando!`
                });
            }

            const canal = interaction.options.getChannel('canal');
            if (!canal) {
                return await interaction.editReply({
                    content: `❌ | Canal de voz não encontrado.`
                });
            }

            // Conecta ao canal de voz
            joinVoiceChannel({
                channelId: canal.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });

            await interaction.editReply({
                content: `\`🟢\` Conectado ao canal de voz **${canal.name}** com sucesso!`
            });

        } catch (error) {
            console.error(`[CONECTAR] Erro na execução:`, error);
            // Mensagem de erro amigável
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content: `❌ | Ocorreu um erro ao tentar conectar ao canal de voz. Tente novamente.`
                    });
                } else {
                    await interaction.followUp({
                        content: `❌ | Erro inesperado.`,
                        ephemeral: true
                    });
                }
            } catch (replyErr) {
                console.error(`[CONECTAR] Falha ao enviar mensagem de erro:`, replyErr);
            }
        }
    }
};