const Discord = require("discord.js");
const { JsonDatabase } = require("wio.db");

const dbp = new JsonDatabase({ databasePath: "./json/perms.json" });
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json" });
const configDb = new JsonDatabase({ databasePath: "./config.json" }); // contém "dono"

module.exports = {
    name: "perms",
    description: "🤖 | Adicione ou remova e veja a lista de pessoas com perms.",
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        // Defer para evitar timeout e garantir ephemeral
        await interaction.deferReply({ ephemeral: true }).catch(err => {
            console.error(`[PERMS] Erro ao deferir:`, err);
            return;
        });

        try {
            // Verifica se é o dono (config.json)
            const donoId = configDb.get(`dono`);
            if (interaction.user.id !== donoId) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Você não tem permissão para usar este comando!`
                });
            }

            // Função para gerar a embed com a lista de permissões
            const gerarEmbedPerms = () => {
                let perms = '';
                const all = dbp.all();
                if (all.length === 0) {
                    perms = 'Nenhum usuário com permissão.';
                } else {
                    all.forEach((entry, index) => {
                        perms += `${index + 1} - <@${entry.data}>\n`;
                    });
                }

                return new Discord.EmbedBuilder()
                    .setTitle(`Configurando Perms`)
                    .setDescription(`Lista de pessoas com permissão:\n\n${perms}`)
                    .setColor(dbc.get(`color`) || 0x2b2d31);
            };

            const row = new Discord.ActionRowBuilder().addComponents(
                new Discord.ButtonBuilder()
                    .setStyle(3)
                    .setCustomId(`add_perm`)
                    .setLabel(`Adicionar Usuário`)
                    .setEmoji(dbe.get(`20`) || '➕'),
                new Discord.ButtonBuilder()
                    .setStyle(4)
                    .setCustomId(`sub_perm`)
                    .setLabel(`Remover Usuário`)
                    .setEmoji(dbe.get(`21`) || '➖'),
            );

            const msg = await interaction.editReply({
                embeds: [gerarEmbedPerms()],
                components: [row]
            });

            // Coletor de botões
            const buttonCollector = msg.createMessageComponentCollector({
                componentType: Discord.ComponentType.Button,
                time: 300_000 // 5 minutos
            });

            buttonCollector.on('collect', async (btnInteraction) => {
                // Apenas o autor original pode usar
                if (btnInteraction.user.id !== interaction.user.id) {
                    return await btnInteraction.reply({
                        content: `${dbe.get('13') || '❌'} | Apenas ${interaction.user} pode usar esses botões.`,
                        ephemeral: true
                    }).catch(() => {});
                }

                try {
                    if (btnInteraction.customId === 'add_perm') {
                        // Pergunta o ID do usuário
                        await btnInteraction.reply({
                            content: `${dbe.get('16') || '⏳'} | Envie o **ID** do usuário que receberá a permissão.`,
                            ephemeral: true
                        });

                        // Coletor de mensagem no canal (apenas do autor)
                        const messageFilter = m => m.author.id === interaction.user.id;
                        const messageCollector = interaction.channel.createMessageCollector({
                            filter: messageFilter,
                            max: 1,
                            time: 60_000
                        });

                        messageCollector.on('collect', async (collectedMsg) => {
                            try {
                                const userId = collectedMsg.content.trim();
                                await collectedMsg.delete().catch(() => {});

                                // Valida se o usuário existe no servidor
                                const member = await interaction.guild.members.fetch(userId).catch(() => null);
                                if (!member) {
                                    return await btnInteraction.editReply({
                                        content: `${dbe.get('13') || '❌'} | Usuário não encontrado no servidor.`,
                                        ephemeral: true
                                    }).catch(() => {});
                                }

                                // Verifica se já tem permissão
                                if (dbp.has(userId)) {
                                    return await btnInteraction.editReply({
                                        content: `${dbe.get('1') || 'ℹ️'} | O usuário ${member} já possui permissão.`,
                                        ephemeral: true
                                    }).catch(() => {});
                                }

                                // Adiciona permissão
                                dbp.set(userId, userId);

                                // Atualiza a mensagem principal
                                await msg.edit({
                                    embeds: [gerarEmbedPerms()],
                                    components: [row]
                                });

                                await btnInteraction.editReply({
                                    content: `${dbe.get('6') || '✅'} | Permissão adicionada para ${member}!`,
                                    ephemeral: true
                                }).catch(() => {});
                            } catch (err) {
                                console.error('[PERMS] Erro ao adicionar:', err);
                            }
                        });

                        messageCollector.on('end', async (collected, reason) => {
                            if (reason === 'time' && collected.size === 0) {
                                await btnInteraction.editReply({
                                    content: `${dbe.get('13') || '❌'} | Tempo esgotado. Nenhum ID foi enviado.`,
                                    ephemeral: true
                                }).catch(() => {});
                            }
                        });

                    } else if (btnInteraction.customId === 'sub_perm') {
                        // Pergunta o ID do usuário para remover
                        await btnInteraction.reply({
                            content: `${dbe.get('16') || '⏳'} | Envie o **ID** do usuário que perderá a permissão.`,
                            ephemeral: true
                        });

                        const messageFilter = m => m.author.id === interaction.user.id;
                        const messageCollector = interaction.channel.createMessageCollector({
                            filter: messageFilter,
                            max: 1,
                            time: 60_000
                        });

                        messageCollector.on('collect', async (collectedMsg) => {
                            try {
                                const userId = collectedMsg.content.trim();
                                await collectedMsg.delete().catch(() => {});

                                const member = await interaction.guild.members.fetch(userId).catch(() => null);
                                if (!member) {
                                    return await btnInteraction.editReply({
                                        content: `${dbe.get('13') || '❌'} | Usuário não encontrado no servidor.`,
                                        ephemeral: true
                                    }).catch(() => {});
                                }

                                // Verifica se NÃO tem permissão
                                if (!dbp.has(userId)) {
                                    return await btnInteraction.editReply({
                                        content: `${dbe.get('13') || '❌'} | O usuário ${member} não possui permissão.`,
                                        ephemeral: true
                                    }).catch(() => {});
                                }

                                // Remove permissão
                                dbp.delete(userId);

                                await msg.edit({
                                    embeds: [gerarEmbedPerms()],
                                    components: [row]
                                });

                                await btnInteraction.editReply({
                                    content: `${dbe.get('6') || '✅'} | Permissão removida de ${member}!`,
                                    ephemeral: true
                                }).catch(() => {});
                            } catch (err) {
                                console.error('[PERMS] Erro ao remover:', err);
                            }
                        });

                        messageCollector.on('end', async (collected, reason) => {
                            if (reason === 'time' && collected.size === 0) {
                                await btnInteraction.editReply({
                                    content: `${dbe.get('13') || '❌'} | Tempo esgotado. Nenhum ID foi enviado.`,
                                    ephemeral: true
                                }).catch(() => {});
                            }
                        });
                    }
                } catch (err) {
                    console.error(`[PERMS] Erro no coletor:`, err);
                    if (!btnInteraction.replied && !btnInteraction.deferred) {
                        await btnInteraction.reply({
                            content: '❌ | Ocorreu um erro inesperado.',
                            ephemeral: true
                        }).catch(() => {});
                    }
                }
            });

            buttonCollector.on('end', async () => {
                try {
                    await msg.edit({ components: [] }).catch(() => {});
                } catch (e) {}
            });

        } catch (error) {
            console.error(`[PERMS] Erro global:`, error);
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content: '❌ | Ocorreu um erro ao executar o comando.'
                    });
                } else {
                    await interaction.followUp({
                        content: '❌ | Erro inesperado.',
                        ephemeral: true
                    });
                }
            } catch (replyErr) {
                console.error(`[PERMS] Falha ao enviar erro:`, replyErr);
            }
        }
    }
};