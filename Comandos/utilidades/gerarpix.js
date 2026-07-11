const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ApplicationCommandType, ApplicationCommandOptionType, AttachmentBuilder, ComponentType } = require("discord.js");
const Discord = require("discord.js");
const { JsonDatabase } = require("wio.db");
const { MercadoPagoConfig, Payment, PaymentRefund } = require("mercadopago");
const axios = require("axios");
const moment = require("moment");
const { sendMessagePixGerado, sendMessagePixCancelado, formatValor, sendMessagePixExpirado, sendMessagePixSucesso, sendMessagePixBlocked } = require("../../Functions/GerarPix");

const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json" });
const dbcar = new JsonDatabase({ databasePath: "./json/carrinho.json" });
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dbep = new JsonDatabase({ databasePath: "./json/emojisGlob.json" });
const dbp = new JsonDatabase({ databasePath: "./json/perms.json" });

module.exports = {
    name: "gerar",
    description: "🤖 | Gere uma cobrança",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "pix",
            description: "🤖 | Gere uma cobrança",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "valor",
                    description: "Valor da cobrança",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        }
    ],

    run: async (client, interaction) => {
        // Defer para evitar timeout
        await interaction.deferReply({ ephemeral: true }).catch(err => {
            console.error(`[GERAR] Erro ao deferir:`, err);
            return;
        });

        try {
            // Permissão corrigida
            if (!dbp.has(interaction.user.id)) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({ content: `${emojiErro} | Você não tem permissão para usar este comando!` });
            }

            // Sistema de vendas OFF
            if (dbc.get(`pagamentos.sistema`) === "OFF") {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({ content: `${emojiErro} | Sistema de vendas automáticas **OFF**. Para gerar um pix ative o sistema de vendas.` });
            }

            // Canal de logs privado
            const palmito = client.channels.cache.get(dbc.get(`canais.vendas_privado`));
            if (!palmito) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({ content: `${emojiErro} | Canal logs inválido! Configure em /painel bot > Gerenciar Financeiro.` });
            }

            // Validação do token do MercadoPago
            const accessToken = dbc.get(`pagamentos.acess_token`);
            if (!accessToken) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({ content: `${emojiErro} | Access Token do Mercado Pago não configurado.` });
            }

            const clientt = new MercadoPagoConfig({ accessToken });
            const payment = new Payment(clientt);
            const refund = new PaymentRefund(clientt);

            const valorStr = interaction.options.getString("valor");
            if (isNaN(valorStr) || valorStr.includes(',')) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({ content: `${emojiErro} | Valor inválido! Use apenas números e ponto (ex: 3.27).` });
            }
            const valor = Number(valorStr);

            // Envia log de geração (função externa, não deve responder à interação)
            await sendMessagePixGerado(interaction, valor).catch(err => console.error('[GERAR] Erro ao enviar log de geração:', err));

            const expiraEm = moment().add(20, 'minutes');
            const timeExpira = Math.floor(expiraEm.valueOf() / 1000);

            const embedSolicitacao = new EmbedBuilder()
                .setAuthor({ name: `Solicitação de pagamento.`, iconURL: interaction.user.displayAvatarURL() })
                .setThumbnail(interaction.guild.iconURL())
                .setDescription(`- O usuário ${interaction.user} gerou um pix, e está fazendo uma solicitação de pagamento. Deseja pagar?`)
                .addFields(
                    { name: `Valor:`, value: `R$${await formatValor(valor)}`, inline: true },
                    { name: `Expira em:`, value: `<t:${timeExpira}:f> (<t:${timeExpira}:R>)`, inline: true }
                );

            const rowSolicitacao = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setStyle(1).setCustomId("pagar").setLabel("Realizar Pagamento").setEmoji(dbep.get("9") || '💳'),
                new ButtonBuilder().setStyle(2).setCustomId("cancelar_solicita").setLabel("Cancelar").setEmoji(dbep.get("37") || '❌')
            );

            // Responde à interação com a solicitação (já deferred)
            const msgSolicitacao = await interaction.editReply({
                embeds: [embedSolicitacao],
                components: [rowSolicitacao]
            }).catch(async (err) => {
                console.error('[GERAR] Erro ao editar reply:', err);
                return await interaction.followUp({ content: '❌ Erro ao exibir solicitação.', ephemeral: true });
            });
            if (!msgSolicitacao) return;

            let status = 1; // 1 = aguardando, 2 = pagamento gerado, "Aprovado", "Banco Bloqueado", "Expirado"

            // Timeout para expirar solicitação
            const timeoutExpirar = setTimeout(async () => {
                if (status === 1) {
                    status = "Expirado";
                    await sendMessagePixExpirado(interaction, valor).catch(() => {});
                    try {
                        await msgSolicitacao.delete();
                        await interaction.channel.send({ content: `${dbe.get("13") || '❌'} | Pagamento expirado!` });
                    } catch (e) {
                        console.error('[GERAR] Erro ao expirar solicitação:', e);
                    }
                }
            }, 1000 * 60 * 20);

            // Coletor para botões da solicitação
            const collectorSolicitacao = msgSolicitacao.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 20 * 60 * 1000
            });

            collectorSolicitacao.on('collect', async (btnInteraction) => {
                // Apenas o autor original pode usar
                if (btnInteraction.user.id !== interaction.user.id) {
                    return await btnInteraction.reply({ content: `${dbe.get("13") || '❌'} | Apenas ${interaction.user} pode usar esses botões.`, ephemeral: true }).catch(() => {});
                }

                try {
                    if (btnInteraction.customId === 'cancelar_solicita') {
                        status = "Cancelado";
                        clearTimeout(timeoutExpirar);
                        collectorSolicitacao.stop();
                        await sendMessagePixCancelado(interaction, valor).catch(() => {});
                        await btnInteraction.update({ embeds: [], components: [], content: `${dbe.get("13") || '❌'} | Pix cancelado!` }).catch(() => {});
                        setTimeout(() => {
                            btnInteraction.message.delete().catch(() => {});
                        }, 30000);
                    }
                    else if (btnInteraction.customId === 'pagar') {
                        // Impede múltiplas gerações
                        if (status !== 1) return;
                        status = 2;
                        clearTimeout(timeoutExpirar);
                        collectorSolicitacao.stop();

                        // Atualiza para "gerando..."
                        await btnInteraction.update({ embeds: [], components: [], content: `${dbe.get("16") || '⏳'} | Aguarde, gerando pagamento.` }).catch(() => {});

                        // Dados do pagamento
                        const payment_data = {
                            transaction_amount: valor,
                            description: `Cobrança Gerada - ${interaction.user.username}`,
                            payment_method_id: 'pix',
                            payer: {
                                email: dbc.get(`email`) || "asaphs595@gmail.com",
                                first_name: 'Paula',
                                last_name: 'Guimaraes',
                                identification: { type: 'CPF', number: '07944777984' },
                                address: { zip_code: '06233200', street_name: 'Av. das Nações Unidas', street_number: '3003', neighborhood: 'Bonfim', city: 'Osasco', federal_unit: 'SP' }
                            },
                            notification_url: interaction.user.displayAvatarURL(),
                        };

                        try {
                            const data = await payment.create({ body: payment_data });
                            // Pagamento criado com sucesso
                            const qrCodeString = data.point_of_interaction.transaction_data.qr_code;
                            const qrCodeBase64 = data.point_of_interaction.transaction_data.qr_code_base64;

                            // QR Code como attachment
                            const buffer = Buffer.from(qrCodeBase64, "base64");
                            const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });

                            const embedPagamento = new EmbedBuilder()
                                .setAuthor({ name: `Pagamento Gerado!`, iconURL: interaction.user.displayAvatarURL() })
                                .setColor(dbc.get("color") || 0x2b2d31)
                                .setDescription(`👋 Olá ${interaction.user}\n- Seu pagamento foi gerado com sucesso! Veja as informações:`)
                                .addFields(
                                    { name: `Valor:`, value: `R$${await formatValor(valor)}`, inline: true },
                                    { name: `Expira em:`, value: `<t:${timeExpira}:f> (<t:${Math.floor(Date.now() / 1000)}:R>)`, inline: true }
                                );

                            const rowPagamento = new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setLabel('Pix Copia e Cola').setEmoji(dbep.get("32") || '📋').setCustomId(`cpc`).setStyle(1),
                                new ButtonBuilder().setLabel('Qr Code').setEmoji(dbep.get("33") || '📱').setCustomId(`qrc`).setStyle(1),
                                new ButtonBuilder().setEmoji(dbep.get("37") || '❌').setCustomId(`cancelarpix`).setStyle(4)
                            );

                            // Edita a mensagem original para mostrar o pagamento
                            await btnInteraction.message.edit({ content: '', embeds: [embedPagamento], components: [rowPagamento] }).catch(() => {});

                            // Novo timeout de 20 min para expirar pagamento
                            let pagamentoStatus = "pendente";
                            const timeoutPagamento = setTimeout(async () => {
                                if (pagamentoStatus === "pendente") {
                                    pagamentoStatus = "expirado";
                                    await sendMessagePixExpirado(interaction, valor).catch(() => {});
                                    try {
                                        await btnInteraction.message.edit({ embeds: [], components: [], content: `${dbe.get("13") || '❌'} | Pagamento expirado!` }).catch(() => {});
                                    } catch (e) {}
                                }
                            }, 1000 * 60 * 20);

                            // Verificação periódica do status do pagamento
                            const checkInterval = setInterval(async () => {
                                try {
                                    const doc = await axios.get(`https://api.mercadopago.com/v1/payments/${data.id}`, {
                                        headers: { 'Authorization': `Bearer ${accessToken}` }
                                    });
                                    const paymentGet = await payment.get({ id: data.id });
                                    const paymentStatus = paymentGet.status;

                                    if (paymentStatus === "approved") {
                                        clearInterval(checkInterval);
                                        clearTimeout(timeoutPagamento);
                                        const longName = doc.data.point_of_interaction.transaction_data.bank_info?.payer?.long_name || "N/A";
                                        const blockedBanks = (await dbc.get("pagamentos.blockbank")) || [];
                                        const isBlocked = Array.isArray(blockedBanks) && blockedBanks.some(term => longName.toLowerCase().includes(term.toLowerCase()));

                                        if (isBlocked) {
                                            // Banco bloqueado: reembolsa e notifica
                                            await refund.create({ payment_id: doc.data.id, body: {} }).catch(() => {});
                                            pagamentoStatus = "banblock";
                                            const embedBlock = new EmbedBuilder()
                                                .setAuthor({ name: `❌ Erro na compra!`, iconURL: interaction.guild.iconURL() })
                                                .setColor("Red")
                                                .setDescription(`Olá ${interaction.user}.\n- Detectamos que você utilizou o banco **${longName}**.\n> Infelizmente, este banco está bloqueado. Seu dinheiro foi reembolsado.`)
                                                .setThumbnail(interaction.user.displayAvatarURL())
                                                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                                                .setTimestamp();
                                            await btnInteraction.message.edit({ embeds: [embedBlock], components: [] }).catch(() => {});
                                            await sendMessagePixBlocked(interaction, valor, longName).catch(() => {});
                                        } else {
                                            // Aprovado com sucesso
                                            pagamentoStatus = "aprovado";
                                            await sendMessagePixSucesso(interaction, valor, doc).catch(() => {});
                                            // Pode adicionar lógica extra se necessário
                                        }
                                    }
                                } catch (err) {
                                    console.error('[GERAR] Erro ao verificar status:', err);
                                }
                            }, 10000);

                            // Coletor para botões do pagamento (copia e cola, qrcode, cancelar)
                            const collectorPagamento = btnInteraction.message.createMessageComponentCollector({
                                componentType: ComponentType.Button,
                                time: 20 * 60 * 1000
                            });

                            collectorPagamento.on('collect', async (pgInteraction) => {
                                if (pgInteraction.user.id !== interaction.user.id) {
                                    return await pgInteraction.reply({ content: `${dbe.get("13") || '❌'} | Apenas ${interaction.user} pode usar esses botões.`, ephemeral: true }).catch(() => {});
                                }
                                if (pgInteraction.customId === 'cpc') {
                                    await pgInteraction.reply({ content: qrCodeString, ephemeral: true }).catch(() => {});
                                } else if (pgInteraction.customId === 'qrc') {
                                    await pgInteraction.reply({ files: [attachment], ephemeral: true }).catch(() => {});
                                } else if (pgInteraction.customId === 'cancelarpix') {
                                    clearInterval(checkInterval);
                                    clearTimeout(timeoutPagamento);
                                    collectorPagamento.stop();
                                    pagamentoStatus = "cancelado";
                                    await sendMessagePixCancelado(interaction, valor).catch(() => {});
                                    await pgInteraction.update({ embeds: [], components: [], content: `${dbe.get("13") || '❌'} | Pagamento cancelado.` }).catch(() => {});
                                    setTimeout(() => pgInteraction.message.delete().catch(() => {}), 5000);
                                }
                            });

                            collectorPagamento.on('end', () => {}); // Silencioso

                        } catch (err) {
                            console.error('[GERAR] Erro ao criar pagamento:', err);
                            await btnInteraction.editReply({ content: `${dbe.get("13") || '❌'} | Ocorreu um erro ao gerar o pagamento. Tente novamente.` }).catch(() => {});
                        }
                    }
                } catch (err) {
                    console.error('[GERAR] Erro no coletor:', err);
                }
            });

            collectorSolicitacao.on('end', () => {});

        } catch (error) {
            console.error(`[GERAR] Erro geral:`, error);
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: `❌ | Ocorreu um erro interno. Tente novamente mais tarde.` });
                } else {
                    await interaction.followUp({ content: `❌ | Erro inesperado.`, ephemeral: true });
                }
            } catch (replyErr) {
                console.error(`[GERAR] Falha ao enviar erro:`, replyErr);
            }
        }
    }
};