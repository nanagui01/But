const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle, ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { JsonDatabase } = require("wio.db");

const emj = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dbp = new JsonDatabase({ databasePath: "./json/perms.json" });
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json" });

module.exports = {
    name: 'say',
    description: "🤖 | Envie uma mensagem normal personalizada",
    options: [
        {
            name: 'channel',
            description: 'Qual canal será enviado?',
            type: ApplicationCommandOptionType.Channel,
            required: true
        },
    ],
    run: async (client, interaction) => {
        // Defer para evitar timeout
        await interaction.deferReply({ ephemeral: true }).catch(err => {
            console.error(`[SAY] Erro ao deferir:`, err);
            return;
        });

        try {
            // Permissão corrigida
            if (!dbp.has(interaction.user.id)) {
                const emojiErro = emj.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Você não tem permissão para usar este comando!`
                });
            }

            const channel = interaction.options.getChannel('channel');
            if (!channel) {
                return await interaction.editReply({ content: '❌ | Canal não encontrado.' });
            }

            let mensagem = '';
            let imagem = null; // Será string (link) para AttachmentBuilder
            let buttons = []; // Array de { nome, emoji, link }

            const embedBase = new EmbedBuilder()
                .setTitle("Configure abaixo os campos da mensagem que deseja configurar.")
                .setFooter({ text: "Clique em cancelar para cancelar." })
                .setColor(dbc.get(`color`) || 0x2b2d31);

            // Linha de configuração (normal)
            const rowNormal = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setStyle(2).setCustomId(`configmsg`).setLabel(`Alterar Mensagem`),
                new ButtonBuilder().setStyle(2).setCustomId(`configimg`).setLabel(`Alterar Imagem`),
                new ButtonBuilder().setStyle(2).setCustomId(`configbuttons`).setLabel(`Configurar Botões`)
            );

            // Linha final (cancelar, enviar, preview)
            const rowFinal = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('cancelar').setLabel('Cancelar').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('send').setLabel('⠀⠀⠀⠀⠀Enviar⠀⠀⠀⠀⠀').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('previw').setLabel('⠀Preview⠀').setStyle(ButtonStyle.Primary),
            );

            const msg = await interaction.editReply({
                embeds: [embedBase],
                components: [rowNormal, rowFinal]
            }).catch(async (err) => {
                console.error('[SAY] Erro ao editar reply inicial:', err);
                return await interaction.followUp({ content: '❌ Erro ao criar painel.', ephemeral: true });
            });
            if (!msg) return;

            // Coletor único (gerencia todos os botões)
            const collector = msg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 360_000 // 6 minutos
            });

            // Função auxiliar para construir a ActionRow de botões customizados
            const buildButtonRow = () => {
                const row = new ActionRowBuilder();
                buttons.forEach(entry => {
                    const btn = new ButtonBuilder()
                        .setStyle(ButtonStyle.Link)
                        .setLabel(entry.nome)
                        .setURL(entry.link);
                    if (entry.emoji) btn.setEmoji(entry.emoji);
                    row.addComponents(btn);
                });
                return row.components.length > 0 ? [row] : [];
            };

            // Função para gerar embed de configuração de botões
            const buildButtonsEmbed = () => {
                let but = '';
                buttons.forEach((entry, index) => {
                    but += `**Botão ${index + 1}**\nNome: ${entry.nome}\nEmoji: ${entry.emoji || "Nenhum"}\nLink: [Aqui](${entry.link})\n\n`;
                });
                return new EmbedBuilder()
                    .setTitle(`Configurando Botões`)
                    .setDescription(`Aqui estão os botões:\n\n${but || "Nenhum até agora :("}`)
                    .setColor(dbc.get(`color`) || 0x2b2d31);
            };

            // Função para construir opções de envio (preview ou canal)
            const buildSendOptions = async (isPreview = false) => {
                const options = { content: mensagem || undefined };
                if (isPreview) options.ephemeral = true;

                if (imagem) {
                    try {
                        const attachment = new AttachmentBuilder(imagem, { name: 'imagem.png' });
                        options.files = [attachment];
                    } catch (e) {
                        // Link inválido, ignora
                    }
                }

                const btnRows = buildButtonRow();
                if (btnRows.length > 0) options.components = btnRows;

                return options;
            };

            collector.on('collect', async (btnInteraction) => {
                // Apenas o autor do comando pode interagir
                if (btnInteraction.user.id !== interaction.user.id) {
                    return await btnInteraction.reply({
                        content: `${emj.get('13') || '❌'} | Apenas ${interaction.user} pode usar esses botões.`,
                        ephemeral: true
                    }).catch(() => {});
                }

                try {
                    const customId = btnInteraction.customId;

                    // --- Botões de ação principal ---
                    if (customId === 'cancelar') {
                        await btnInteraction.deferUpdate();
                        await btnInteraction.message.delete().catch(() => {});
                    }
                    else if (customId === 'previw') {
                        const options = await buildSendOptions(true);
                        await btnInteraction.reply(options).catch(async (err) => {
                            console.error('[SAY] Erro no preview:', err);
                            await btnInteraction.reply({
                                content: `${emj.get('13') || '❌'} **|** Erro ao gerar preview. Verifique os dados.`,
                                ephemeral: true
                            }).catch(() => {});
                        });
                    }
                    else if (customId === 'send') {
                        await btnInteraction.deferUpdate();
                        const options = await buildSendOptions(false);

                        try {
                            await channel.send(options);
                            await btnInteraction.message.delete().catch(() => {});
                        } catch (err) {
                            console.error('[SAY] Erro ao enviar mensagem:', err);
                            await btnInteraction.followUp({
                                content: `${emj.get('13') || '❌'} **|** Houve um erro ao enviar a mensagem. Verifique minhas permissões no canal.`,
                                ephemeral: true
                            }).catch(() => {});
                        }
                    }

                    // --- Configuração de mensagem ---
                    else if (customId === 'configmsg') {
                        const modalId = 'modal_msg_' + Date.now();
                        const modal = new ModalBuilder()
                            .setCustomId(modalId)
                            .setTitle('Mensagem')
                            .addComponents(
                                new ActionRowBuilder().addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('texto')
                                        .setLabel("Qual seria a nova mensagem?")
                                        .setStyle(TextInputStyle.Paragraph)
                                        .setRequired(true)
                                )
                            );

                        await btnInteraction.showModal(modal);
                        const submitted = await btnInteraction.awaitModalSubmit({
                            time: 600_000,
                            filter: (modalInt) => modalInt.user.id === interaction.user.id && modalInt.customId === modalId
                        }).catch(() => null);

                        if (submitted) {
                            await submitted.deferUpdate();
                            mensagem = submitted.fields.getTextInputValue('texto');
                        }
                    }

                    // --- Configuração de imagem ---
                    else if (customId === 'configimg') {
                        const modalId = 'modal_img_' + Date.now();
                        const modal = new ModalBuilder()
                            .setCustomId(modalId)
                            .setTitle('Imagem')
                            .addComponents(
                                new ActionRowBuilder().addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('link')
                                        .setLabel("Qual seria a imagem? Cole o link.")
                                        .setPlaceholder('https://...')
                                        .setStyle(TextInputStyle.Short)
                                        .setRequired(true)
                                )
                            );

                        await btnInteraction.showModal(modal);
                        const submitted = await btnInteraction.awaitModalSubmit({
                            time: 600_000,
                            filter: (modalInt) => modalInt.user.id === interaction.user.id && modalInt.customId === modalId
                        }).catch(() => null);

                        if (submitted) {
                            const link = submitted.fields.getTextInputValue('link');
                            if (link.startsWith('https://')) {
                                await submitted.deferUpdate();
                                imagem = link;
                            } else {
                                await submitted.reply({
                                    content: `${emj.get('13') || '❌'} **|** Envie um link válido (https://).`,
                                    ephemeral: true
                                }).catch(() => {});
                            }
                        }
                    }

                    // --- Abrir configuração de botões ---
                    else if (customId === 'configbuttons') {
                        await btnInteraction.deferUpdate();
                        const embedBtns = buildButtonsEmbed();
                        const rowBtns = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setStyle(2).setCustomId('configbuttonadd').setLabel('Adicionar Botão').setEmoji(emj.get('20') || '➕'),
                            new ButtonBuilder().setStyle(2).setCustomId('configbuttonsub').setLabel('Remover Botão').setEmoji(emj.get('21') || '➖'),
                            new ButtonBuilder().setStyle(2).setCustomId('configbuttonvoltar').setLabel('Voltar').setEmoji(emj.get('29') || '↩️')
                        );
                        await msg.edit({ components: [rowBtns, rowFinal], embeds: [embedBtns] });
                    }

                    // --- Voltar da config de botões ---
                    else if (customId === 'configbuttonvoltar') {
                        await btnInteraction.deferUpdate();
                        await msg.edit({ components: [rowNormal, rowFinal], embeds: [embedBase] });
                    }

                    // --- Adicionar botão ---
                    else if (customId === 'configbuttonadd') {
                        if (buttons.length >= 5) {
                            return await btnInteraction.reply({
                                content: `${emj.get('13') || '❌'} **|** Limite máximo de 5 botões atingido.`,
                                ephemeral: true
                            }).catch(() => {});
                        }

                        const modalId = 'modal_addbtn_' + Date.now();
                        const modal = new ModalBuilder()
                            .setCustomId(modalId)
                            .setTitle('Adicionar Botão')
                            .addComponents(
                                new ActionRowBuilder().addComponents(
                                    new TextInputBuilder().setCustomId('nome').setLabel('Nome do botão').setStyle(TextInputStyle.Short).setRequired(true)
                                ),
                                new ActionRowBuilder().addComponents(
                                    new TextInputBuilder().setCustomId('emoji').setLabel('Emoji do botão (opcional)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(10)
                                ),
                                new ActionRowBuilder().addComponents(
                                    new TextInputBuilder().setCustomId('link').setLabel('Link do botão').setPlaceholder('https://...').setStyle(TextInputStyle.Short).setRequired(true)
                                )
                            );

                        await btnInteraction.showModal(modal);
                        const submitted = await btnInteraction.awaitModalSubmit({
                            time: 600_000,
                            filter: (modalInt) => modalInt.user.id === interaction.user.id && modalInt.customId === modalId
                        }).catch(() => null);

                        if (submitted) {
                            const nome = submitted.fields.getTextInputValue('nome');
                            const emojiInput = submitted.fields.getTextInputValue('emoji').trim();
                            const link = submitted.fields.getTextInputValue('link');

                            if (!link.startsWith('https://')) {
                                return await submitted.reply({
                                    content: `${emj.get('13') || '❌'} **|** Envie um link válido (https://).`,
                                    ephemeral: true
                                }).catch(() => {});
                            }

                            // Validação simples de emoji (unicode, <a:...>, <:...>)
                            const emojiValido = emojiInput === '' ||
                                /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(emojiInput) ||
                                /^<a?:\w+:\d+>$/.test(emojiInput);

                            if (emojiInput !== '' && !emojiValido) {
                                return await submitted.reply({
                                    content: `${emj.get('13') || '❌'} **|** Emoji inválido.`,
                                    ephemeral: true
                                }).catch(() => {});
                            }

                            buttons.push({ nome, emoji: emojiInput || null, link });
                            await submitted.deferUpdate();

                            const embedBtns = buildButtonsEmbed();
                            const rowBtns = new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setStyle(2).setCustomId('configbuttonadd').setLabel('Adicionar Botão').setEmoji(emj.get('20') || '➕'),
                                new ButtonBuilder().setStyle(2).setCustomId('configbuttonsub').setLabel('Remover Botão').setEmoji(emj.get('21') || '➖'),
                                new ButtonBuilder().setStyle(2).setCustomId('configbuttonvoltar').setLabel('Voltar').setEmoji(emj.get('29') || '↩️')
                            );
                            await msg.edit({ components: [rowBtns, rowFinal], embeds: [embedBtns] });
                        }
                    }

                    // --- Remover botão ---
                    else if (customId === 'configbuttonsub') {
                        if (buttons.length === 0) {
                            return await btnInteraction.reply({
                                content: `${emj.get('13') || '❌'} **|** Nenhum botão para remover.`,
                                ephemeral: true
                            }).catch(() => {});
                        }

                        const modalId = 'modal_rmbtn_' + Date.now();
                        const modal = new ModalBuilder()
                            .setCustomId(modalId)
                            .setTitle('Remover Botão')
                            .addComponents(
                                new ActionRowBuilder().addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('id')
                                        .setLabel(`Número do botão (1 a ${buttons.length})`)
                                        .setStyle(TextInputStyle.Short)
                                        .setRequired(true)
                                )
                            );

                        await btnInteraction.showModal(modal);
                        const submitted = await btnInteraction.awaitModalSubmit({
                            time: 600_000,
                            filter: (modalInt) => modalInt.user.id === interaction.user.id && modalInt.customId === modalId
                        }).catch(() => null);

                        if (submitted) {
                            const num = parseInt(submitted.fields.getTextInputValue('id'));
                            if (isNaN(num) || num < 1 || num > buttons.length) {
                                return await submitted.reply({
                                    content: `${emj.get('13') || '❌'} **|** Digite um número entre 1 e ${buttons.length}.`,
                                    ephemeral: true
                                }).catch(() => {});
                            }

                            buttons.splice(num - 1, 1);
                            await submitted.deferUpdate();

                            const embedBtns = buildButtonsEmbed();
                            const rowBtns = new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setStyle(2).setCustomId('configbuttonadd').setLabel('Adicionar Botão').setEmoji(emj.get('20') || '➕'),
                                new ButtonBuilder().setStyle(2).setCustomId('configbuttonsub').setLabel('Remover Botão').setEmoji(emj.get('21') || '➖'),
                                new ButtonBuilder().setStyle(2).setCustomId('configbuttonvoltar').setLabel('Voltar').setEmoji(emj.get('29') || '↩️')
                            );
                            await msg.edit({ components: [rowBtns, rowFinal], embeds: [embedBtns] });
                        }
                    }
                } catch (err) {
                    console.error(`[SAY] Erro no coletor (${btnInteraction.customId}):`, err);
                    // Tenta responder se possível
                    if (!btnInteraction.replied && !btnInteraction.deferred) {
                        await btnInteraction.reply({
                            content: `${emj.get('13') || '❌'} | Ocorreu um erro inesperado.`,
                            ephemeral: true
                        }).catch(() => {});
                    }
                }
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    try {
                        await msg.edit({
                            components: [],
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription('⏰ | Tempo de configuração expirado.')
                                    .setColor('#ff0000')
                            ]
                        });
                    } catch (e) {
                        console.error('[SAY] Erro ao editar mensagem expirada:', e);
                    }
                }
            });

        } catch (error) {
            console.error(`[SAY] Erro global:`, error);
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: '❌ | Ocorreu um erro interno ao executar o comando.' });
                } else {
                    await interaction.followUp({ content: '❌ | Erro inesperado.', ephemeral: true });
                }
            } catch (replyErr) {
                console.error(`[SAY] Falha ao enviar erro:`, replyErr);
            }
        }
    }
};