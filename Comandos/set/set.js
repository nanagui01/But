const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const Discord = require("discord.js");
const { JsonDatabase } = require("wio.db");
const { updateEspecifico, sendMessage } = require("../../Functions/UpdateMessageBuy");

const dbe  = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dbc  = new JsonDatabase({ databasePath: "./json/botconfig.json" });
const dbp  = new JsonDatabase({ databasePath: "./json/personalizados.json" });
const dbpp = new JsonDatabase({ databasePath: "./json/perms.json" });
const db   = new JsonDatabase({ databasePath: "./json/produtos.json" });

module.exports = {
    name: "set",
    description: "🤖 | Envie o painel de compra.",
    type: Discord.ApplicationCommandType.ChatInput,
    options: [
        {
            name: "painel",
            description: "Escolha um painel.",
            type: Discord.ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true,
        }
    ],

    async autocomplete(interaction) {
        try {
            const value = interaction.options.getFocused().toLowerCase();
            const choices = db.all().filter(pd => pd.data && pd.data.id);

            const filtered = choices
                .filter(choice => choice.data.id.toLowerCase().includes(value))
                .slice(0, 25);

            if (choices.length === 0) {
                await interaction.respond([
                    { name: "Nenhum painel foi criado!", value: "nenhum_painel" }
                ]);
            } else if (filtered.length === 0) {
                await interaction.respond([
                    { name: "Nenhum painel encontrado com esse nome.", value: "nao_encontrado" }
                ]);
            } else {
                await interaction.respond(
                    filtered.map(choice => ({
                        name: `ID - ${choice.data.id} | Nome - ${choice.data.titulo}`,
                        value: choice.data.id
                    }))
                );
            }
        } catch (error) {
            console.error('[SET] Erro no autocomplete:', error);
            await interaction.respond([{ name: "Erro ao carregar painéis!", value: "erro" }]);
        }
    },

    run: async (client, interaction) => {
        // Defer para evitar timeout e garantir resposta ephemeral
        await interaction.deferReply({ ephemeral: true }).catch(err => {
            console.error(`[SET] Erro ao deferir:`, err);
            return;
        });

        try {
            // Permissão corrigida
            if (!dbpp.has(interaction.user.id)) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Você não tem permissão para usar este comando!`
                });
            }

            const painelId = interaction.options.getString("painel");

            // Envia a mensagem do painel
            await sendMessage(interaction, painelId, interaction.channel.id);

            const emojiSucesso = dbe.get(`6`) || '✅';
            await interaction.editReply({
                content: `${emojiSucesso} | Mensagem enviada com sucesso!`
            });

        } catch (error) {
            console.error(`[SET] Erro ao enviar painel:`, error);
            // Responde com erro amigável
            const emojiErro = dbe.get(`13`) || '❌';
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content: `${emojiErro} | Ocorreu um erro ao enviar o painel. Verifique o console.`
                    });
                } else {
                    await interaction.followUp({
                        content: `${emojiErro} | Erro inesperado.`,
                        ephemeral: true
                    });
                }
            } catch (replyErr) {
                console.error(`[SET] Falha ao enviar mensagem de erro:`, replyErr);
            }
        }
    }
};