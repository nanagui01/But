const Discord = require("discord.js");
const { EmbedBuilder, ModalBuilder, TextInputBuilder, ActionRowBuilder } = require("discord.js");
const { JsonDatabase } = require("wio.db");

const dbe = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dbp = new JsonDatabase({ databasePath: "./json/perms.json" });

module.exports = {
    name: `status`,
    description: `🤖 | Mude os meus status.`,
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        // Defer para evitar timeout ao abrir o modal
        await interaction.deferReply({ ephemeral: true }).catch(err => {
            console.error(`[STATUS] Erro ao deferir:`, err);
            return;
        });

        try {
            // Verificação de permissão
            if (!dbp.has(interaction.user.id)) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Você não tem permissão para usar este comando!`
                });
            }

            // Criação do modal
            const modal = new ModalBuilder()
                .setTitle("Alterar Status do seu BOT")
                .setCustomId("modalconfigstatus");

            const presenceInput = new TextInputBuilder()
                .setCustomId("presence")
                .setRequired(true)
                .setPlaceholder("Online, Ausente, Invisivel ou Ocupado")
                .setLabel("ESCOLHA O TIPO DE PRESENÇA:")
                .setStyle(Discord.TextInputStyle.Short);

            const atividadeInput = new TextInputBuilder()
                .setCustomId("atividade")
                .setRequired(true)
                .setPlaceholder("Jogando, Assistindo, Competindo, Transmitindo, Ouvindo")
                .setLabel("ESCOLHA O TIPO DE ATIVIDADE:")
                .setStyle(Discord.TextInputStyle.Short);

            const textoInput = new TextInputBuilder()
                .setCustomId("text_ativd")
                .setRequired(true)
                .setPlaceholder("Digite aqui")
                .setLabel("ESCREVA O TEXTO DA ATIVIDADE:")
                .setStyle(Discord.TextInputStyle.Short);

            const urlInput = new TextInputBuilder()
                .setCustomId("url")
                .setRequired(false)
                .setLabel("URL DO CANAL:")
                .setPlaceholder("Se a escolha foi Transmitindo, Coloque a Url aqui, ex: https://www.twitch.tv/discord")
                .setStyle(Discord.TextInputStyle.Paragraph);

            modal.addComponents(
                new ActionRowBuilder().addComponents(presenceInput),
                new ActionRowBuilder().addComponents(atividadeInput),
                new ActionRowBuilder().addComponents(textoInput),
                new ActionRowBuilder().addComponents(urlInput)
            );

            // Mostra o modal
            await interaction.showModal(modal);

            // Aguarda a submissão do modal
            const submitted = await interaction.awaitModalSubmit({
                time: 600_000, // 10 minutos
                filter: (modalInteraction) => modalInteraction.user.id === interaction.user.id && modalInteraction.customId === "modalconfigstatus"
            }).catch(() => null);

            if (!submitted) {
                // Se o modal expirou ou foi cancelado, não há resposta pendente
                return;
            }

            await submitted.deferReply({ ephemeral: true }).catch(() => {});

            // Mapeamento de presenças e atividades
            const presenceMap = {
                "online": "online",
                "ausente": "idle",
                "invisivel": "invisible",
                "ocupado": "dnd"
            };

            const activityMap = {
                "jogando": "PLAYING",
                "assistindo": "WATCHING",
                "competindo": "COMPETING",
                "transmitindo": "STREAMING",
                "ouvindo": "LISTENING"
            };

            const presenceChoice = submitted.fields.getTextInputValue("presence").toLowerCase();
            const activityChoice = submitted.fields.getTextInputValue("atividade").toLowerCase();
            const activityText = submitted.fields.getTextInputValue("text_ativd");
            const url = submitted.fields.getTextInputValue("url") || null;

            // Validações
            if (!presenceMap[presenceChoice]) {
                return await submitted.editReply({
                    content: `❌ | Tipo de presença inválido! Use: Online, Ausente, Invisivel ou Ocupado.`
                });
            }

            if (!activityMap[activityChoice]) {
                return await submitted.editReply({
                    content: `❌ | Tipo de atividade inválido! Use: Jogando, Assistindo, Competindo, Transmitindo, Ouvindo.`
                });
            }

            if (activityChoice === "transmitindo" && !url) {
                return await submitted.editReply({
                    content: `❌ | Para "Transmitindo", você precisa fornecer uma URL (ex: https://www.twitch.tv/discord).`
                });
            }

            // Atualiza o status do bot
            const statusType = presenceMap[presenceChoice];
            const activityType = activityMap[activityChoice];

            client.user.setStatus(statusType);

            const activityOptions = {
                name: activityText,
                type: Discord.ActivityType[activityType]
            };

            if (activityChoice === "transmitindo" && url) {
                activityOptions.url = url;
            }

            client.user.setActivity(activityOptions);

            await submitted.editReply({
                content: `✅ | Status alterado com sucesso!\n` +
                    `**Presença:** ${presenceChoice}\n` +
                    `**Atividade:** ${activityChoice} ${activityText}${url ? ` (${url})` : ''}`
            });

        } catch (error) {
            console.error(`[STATUS] Erro na execução:`, error);
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: `❌ | Ocorreu um erro ao alterar o status.` });
                } else {
                    await interaction.followUp({ content: `❌ | Erro inesperado.`, ephemeral: true });
                }
            } catch (replyErr) {
                console.error(`[STATUS] Falha ao enviar mensagem de erro:`, replyErr);
            }
        }
    }
};