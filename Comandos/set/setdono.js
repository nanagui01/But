const Discord = require("discord.js");
const { JsonDatabase } = require("wio.db");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder } = require("discord.js");

const dbp = new JsonDatabase({ databasePath: "./json/perms.json" });
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dono = new JsonDatabase({ databasePath: "./config.json" });

module.exports = {
    name: "setdono",
    description: "🤖 | Seta a pessoa que usou como dono do BOT.",
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        try {
            const emojiSucesso = dbe.get(`6`) || '✅';
            const emojiErro = dbe.get(`13`) || '❌';

            // Verifica se já existe dono configurado
            if (!dono.get(`setdono`)) {
                // ===== PRIMEIRA CONFIGURAÇÃO =====
                const modal = new ModalBuilder()
                    .setCustomId(`senharecupera`)
                    .setTitle('SENHA DE RECUPERAÇÃO')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('text')
                                .setLabel("COLOQUE UMA SENHA")
                                .setMinLength(4)
                                .setPlaceholder(`Coloque a senha que você possa redefinir o dono!`)
                                .setStyle(Discord.TextInputStyle.Short)
                        )
                    );

                // Mostra o modal (sem defer antes, pois é modal)
                await interaction.showModal(modal);

                // Aguarda submissão
                const submitted = await interaction.awaitModalSubmit({
                    time: 600_000,
                    filter: (modalInt) => modalInt.user.id === interaction.user.id && modalInt.customId === "senharecupera"
                }).catch(() => null);

                if (!submitted) {
                    // Se o modal expirou ou foi cancelado, responde à interação original
                    return await interaction.reply({
                        content: `${emojiErro} | Tempo esgotado ou modal cancelado.`,
                        ephemeral: true
                    }).catch(() => {});
                }

                // Salva as configurações
                const senha = submitted.fields.getTextInputValue('text');
                dono.set(`dono`, interaction.user.id);
                dono.set(`senha`, senha);
                dono.set(`setdono`, "setado");
                dbp.set(`${interaction.user.id}`, interaction.user.id);

                // Responde ao modal (a interação original)
                const replyMsg = await interaction.reply({
                    content: `${emojiSucesso} | Dono ${interaction.user} setado com sucesso!`,
                    ephemeral: true
                });

                // Envia senha por DM e apaga a resposta após 5s
                try {
                    await interaction.user.send(`# Senha\nA senha para recuperar a posse do seu bot é **${senha}**!`);
                } catch (err) {
                    console.error(`[SETDONO] Não foi possível enviar DM para ${interaction.user.tag}:`, err);
                    // Não quebra o fluxo
                }

                setTimeout(() => {
                    replyMsg.delete().catch(() => {});
                }, 5000);

            } else {
                // ===== RECUPERAÇÃO DE DONO =====
                const modal = new ModalBuilder()
                    .setCustomId(`recuperarbot`)
                    .setTitle('SENHA DE RECUPERAÇÃO')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('text')
                                .setLabel("COLOQUE A SENHA")
                                .setMinLength(4)
                                .setPlaceholder(`Coloque a senha que você definiu de recuperação!`)
                                .setStyle(Discord.TextInputStyle.Short)
                        )
                    );

                await interaction.showModal(modal);

                const submitted = await interaction.awaitModalSubmit({
                    time: 600_000,
                    filter: (modalInt) => modalInt.user.id === interaction.user.id && modalInt.customId === "recuperarbot"
                }).catch(() => null);

                if (!submitted) {
                    return await interaction.reply({
                        content: `${emojiErro} | Tempo esgotado ou modal cancelado.`,
                        ephemeral: true
                    }).catch(() => {});
                }

                const senhaDigitada = submitted.fields.getTextInputValue('text');
                const senhaCorreta = dono.get(`senha`);

                if (senhaDigitada === senhaCorreta) {
                    // Remove dono antigo e define o novo
                    dono.delete(`dono`);
                    dono.delete(`senha`);
                    dono.delete(`setdono`);
                    dbp.deleteAll(); // Limpa permissões (apenas IDs de permissão)
                    dbp.set(`${interaction.user.id}`, interaction.user.id);

                    const replyMsg = await interaction.reply({
                        content: `${emojiSucesso} | Dono e senha removidos! Adicione uma nova senha agora mesmo.`,
                        ephemeral: true
                    });

                    setTimeout(() => {
                        replyMsg.delete().catch(() => {});
                    }, 5000);
                } else {
                    const replyMsg = await interaction.reply({
                        content: `${emojiErro} | Cai fora intruso! Caso você insista demais em roubar a posse do bot, avisaremos o dono.`,
                        ephemeral: true
                    });

                    setTimeout(() => {
                        replyMsg.delete().catch(() => {});
                    }, 5000);
                }
            }
        } catch (error) {
            console.error(`[SETDONO] Erro na execução:`, error);
            // Tenta responder se a interação ainda estiver ativa
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: `❌ | Ocorreu um erro interno ao configurar o dono.`,
                        ephemeral: true
                    });
                } else if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content: `❌ | Ocorreu um erro interno.`
                    });
                }
            } catch (replyErr) {
                console.error(`[SETDONO] Falha ao enviar mensagem de erro:`, replyErr);
            }
        }
    }
};