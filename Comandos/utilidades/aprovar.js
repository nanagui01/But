const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, AttachmentBuilder } = require("discord.js");
const Discord = require("discord.js");
const { JsonDatabase } = require("wio.db");

const dbe  = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dc   = new JsonDatabase({ databasePath: "./json/carrinho.json" });
const dbc  = new JsonDatabase({ databasePath: "./json/botconfig.json" });
const db   = new JsonDatabase({ databasePath: "./json/produtos.json" });
const dbr  = new JsonDatabase({ databasePath: "./json/rendimentos.json" });
const dbru = new JsonDatabase({ databasePath: "./json/rankUsers.json" });
const dbrp = new JsonDatabase({ databasePath: "./json/rankProdutos.json" });
const dbcp = new JsonDatabase({ databasePath: "./json/perfil.json" });
const dbp  = new JsonDatabase({ databasePath: "./json/perms.json" });

module.exports = {
    name: `aprovar`,
    description: `🤖 | Aprove uma compra.`,
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        // 🔒 Defer para evitar timeout e garantir resposta ephemeral
        await interaction.deferReply({ ephemeral: true }).catch(err => {
            console.error(`[APROVAR] Erro ao deferir:`, err);
            return;
        });

        try {
            // 👑 Verificação de permissão corrigida
            if (!dbp.has(interaction.user.id)) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Você não tem permissão para usar este comando!`
                });
            }

            // 🛒 Verifica se há carrinho no canal
            if (!dc.has(`${interaction.channel.id}`)) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Não existe nenhum carrinho neste canal!`
                });
            }

            // ⚠️ Modo eSales não permite aprovação manual
            if (dc.get(`${interaction.channel.id}.eSales`) === "ON") {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Não é possível aprovar um carrinho no modo \`eSales\``
                });
            }

            // 💳 Verifica sistema EFI ativo (indisponível)
            if (dbc.get("pagamentos.sistema_efi") === "ON") {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Comando indisponível no momento.`
                });
            }

            // ✅ Aprova o carrinho
            dc.set(`${interaction.channel.id}.status`, "aprovado");
            dc.set(`${interaction.channel.id}.forma`, "manualmente");

            const emojiSucesso = dbe.get(`6`) || '✅';
            await interaction.editReply({
                content: `${emojiSucesso} | Carrinho aprovado com sucesso!`
            });

        } catch (error) {
            console.error(`[APROVAR] Erro na execução:`, error);
            // Resposta de fallback amigável ao usuário
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content: '❌ Ocorreu um erro interno ao processar a aprovação. Tente novamente.'
                    });
                } else {
                    await interaction.followUp({
                        content: '❌ Erro inesperado.',
                        ephemeral: true
                    });
                }
            } catch (replyErr) {
                console.error(`[APROVAR] Falha ao enviar mensagem de erro:`, replyErr);
            }
        }
    }
};