const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle, ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const config = require('../../config.json'); // mantido, mesmo que não usado
const { JsonDatabase } = require("wio.db");
const emj = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dbp = new JsonDatabase({ databasePath: "./json/perms.json" });

module.exports = {
    name: 'anunciar',
    description: "🤖 | Envie um anuncio.",
    options: [
        {
            name: 'channel',
            description: 'Qual canal será enviado?',
            type: ApplicationCommandOptionType.Channel,
            required: true
        },
    ],
    run: async (client, inter) => {
        // Defer para evitar timeout e garantir ephemeral
        await inter.deferReply({ ephemeral: true }).catch(err => {
            console.error(`[ANUNCIAR] Erro ao deferir:`, err);
            return;
        });

        try {
            // Permissão corrigida
            if (!dbp.has(inter.user.id)) {
                const emojiErro = emj.get(`13`) || '❌';
                return await inter.editReply({
                    content: `${emojiErro} | Você não tem permissão para usar este comando!`
                });
            }

            const channel = inter.options.getChannel('channel');
            if (!channel) {
                return await inter.editReply({ content: '❌ | Canal não encontrado.' });
            }

            const embedGuia = new EmbedBuilder()
                .setTitle("Configure abaixo os campos da embed que deseja configurar.")
                .setFooter({ text: "Clique em cancelar para cancelar o anúncio." })
                .setColor('#ff00b4');

            const embedPreview = new EmbedBuilder(); // começa vazia

            const botoes = [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('title').setLabel('⠀Titulo').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('desc').setLabel('Descrição').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('image').setLabel('Imagem').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('tumb').setLabel('Miniatura').setStyle(ButtonStyle.Secondary),
                ),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('autor').setLabel('⠀Author⠀').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('footer').setLabel('⠀Rodapé⠀').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('date').setLabel('⠀Data⠀').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('cor').setLabel('⠀Cor⠀').setStyle(ButtonStyle.Secondary),
                ),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('cancelar').setLabel('Cancelar').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('send').setLabel('⠀⠀⠀⠀⠀Enviar⠀⠀⠀⠀⠀').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('previw').setLabel('⠀Preview⠀').setStyle(ButtonStyle.Primary),
                ),
            ];

            const message = await inter.editReply({
                embeds: [embedGuia],
                components: botoes
            }).catch(async (err) => {
                console.error(`[ANUNCIAR] Erro ao editar reply inicial:`, err);
                return await inter.followUp({ content: '❌ | Erro ao criar painel de anúncio.', ephemeral: true });
            });
            if (!message) return; // caso falhe

            const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 360_000 });

            collector.on('collect', async i => {
                // Apenas o autor da interação original pode usar os botões
                if (i.user.id !== inter.user.id) {
                    return await i.reply({ content: `${emj.get(`13`) || '❌'} | Você não pode usar esses botões.`, ephemeral: true }).catch(() => {});
                }

                // Para evitar múltiplas respostas, deferir e tratar com editReply/followUp
                try {
                    if (i.customId === 'cancelar') {
                        await i.deferUpdate();
                        await i.message.delete().catch(() => {});
                    }
                    else if (i.customId === 'previw') {
                        // Preview: tenta enviar embed preview; se vazia, avisa
                        if (!embedPreview.data || Object.keys(embedPreview.data).length === 0) {
                            await i.reply({ content: '📋 | A embed está vazia. Configure pelo menos um campo.', ephemeral: true });
                        } else {
                            await i.reply({ embeds: [embedPreview], ephemeral: true }).catch(() => {});
                        }
                    }
                    else if (i.customId === 'send') {
                        await i.deferUpdate();
                        // Envia ao canal selecionado (sem ephemeral!)
                        await channel.send({ embeds: [embedPreview] }).catch(err => {
                            console.error(`[ANUNCIAR] Erro ao enviar anúncio:`, err);
                            i.followUp({ content: `${emj.get(`13`) || '❌'} **|** Houve um erro ao enviar o anúncio.`, ephemeral: true }).catch(() => {});
                            return;
                        });
                        // Deleta a mensagem do painel
                        await i.message.delete().catch(() => {});
                    }
                    else if (['title','desc','image','tumb','autor','footer','date','cor'].includes(i.customId)) {
                        // Botões que abrem modal ou ação direta (date)
                        if (i.customId === 'date') {
                            await i.deferUpdate();
                            embedPreview.setTimestamp();
                            // Edita a mensagem do guia para mostrar que timestamp foi adicionado
                            await i.message.edit({ embeds: [embedGuia], components: botoes }).catch(() => {});
                            return;
                        }

                        // Para os demais, abre modal
                        const date = 'edit_' + Date.now();
                        const collectorFilter = (modalInteraction) => {
                            return modalInteraction.user.id === inter.user.id && modalInteraction.customId === date;
                        };

                        const modalTitle = {
                            title: 'Título',
                            desc: 'Descrição',
                            image: 'Imagem',
                            tumb: 'Miniatura',
                            autor: 'Autor',
                            footer: 'Rodapé',
                            cor: 'Cor'
                        }[i.customId] || 'Configuração';

                        const modal = new ModalBuilder()
                            .setCustomId(date)
                            .setTitle(modalTitle)
                            .addComponents(
                                new ActionRowBuilder().addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('text')
                                        .setLabel(`Qual ${modalTitle.toLowerCase()}?`)
                                        .setStyle(i.customId === 'desc' ? TextInputStyle.Paragraph : TextInputStyle.Short)
                                )
                            );

                        await i.showModal(modal).catch(err => {
                            console.error(`[ANUNCIAR] Erro ao mostrar modal:`, err);
                            i.followUp({ content: `${emj.get(`13`) || '❌'} | Erro ao abrir o formulário.`, ephemeral: true }).catch(() => {});
                        });

                        // Aguarda submissão do modal
                        const submitted = await i.awaitModalSubmit({ time: 600_000, filter: collectorFilter }).catch(err => {
                            console.error(`[ANUNCIAR] Modal não enviado ou erro:`, err);
                            return null;
                        });
                        if (!submitted) return;

                        await submitted.deferUpdate().catch(() => {});

                        const valor = submitted.fields.getTextInputValue('text');
                        switch (i.customId) {
                            case 'title': embedPreview.setTitle(valor); break;
                            case 'desc': embedPreview.setDescription(valor); break;
                            case 'image': embedPreview.setImage(valor); break;
                            case 'tumb': embedPreview.setThumbnail(valor); break;
                            case 'autor': embedPreview.setAuthor({ name: valor }); break;
                            case 'footer': embedPreview.setFooter({ text: valor }); break;
                            case 'cor': embedPreview.setColor(valor); break;
                        }
                        // Atualiza a mensagem do guia (apenas para manter, sem alterações visuais)
                        await i.message.edit({ embeds: [embedGuia], components: botoes }).catch(() => {});
                    }
                } catch (err) {
                    console.error(`[ANUNCIAR] Erro no coletor:`, err);
                    // Tenta responder se possível
                    if (!i.replied && !i.deferred) {
                        await i.reply({ content: `${emj.get(`13`) || '❌'} | Ocorreu um erro inesperado.`, ephemeral: true }).catch(() => {});
                    }
                }
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    // Expirou, editar a mensagem para remover botões e informar
                    try {
                        await message.edit({
                            components: [],
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription('⏰ | Tempo de configuração do anúncio expirado.')
                                    .setColor('#ff0000')
                            ]
                        });
                    } catch (err) {
                        console.error(`[ANUNCIAR] Erro ao editar mensagem expirada:`, err);
                    }
                }
            });

        } catch (error) {
            console.error(`[ANUNCIAR] Erro global:`, error);
            try {
                if (inter.deferred || inter.replied) {
                    await inter.editReply({ content: '❌ | Ocorreu um erro interno ao executar o comando.' });
                } else {
                    await inter.followUp({ content: '❌ | Erro inesperado.', ephemeral: true });
                }
            } catch (replyErr) {
                console.error(`[ANUNCIAR] Falha ao enviar erro:`, replyErr);
            }
        }
    }
};