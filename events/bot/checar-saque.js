const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder} = require("discord.js")
const { JsonDatabase } = require("wio.db")
const Discord = require("discord.js")
const cfg = new JsonDatabase({ databasePath: "./json/configGlob.json"})
const dbs = new JsonDatabase({ databasePath: "./json/saldo.json"})
const axios = require("axios")

module.exports = {
    name: "ready",
    run: async (client) => {
        async function formatValor(valor) {
            return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }

        async function atualizarDados(id, func, valor) {
            try {
                const pedidos = await dbs.get("historico") || []
                const find = pedidos.findIndex(a => a.id === id)
                if (find === -1) {
                    console.error(`[checar-saque] Pedido com id "${id}" não encontrado no histórico ao atualizar status.`)
                    return
                }
                pedidos[find].status = func
                if (func === "recusado" && valor !== undefined) dbs.add(`saldo`, valor)
                await dbs.set("historico", pedidos)
            } catch (error) {
                console.error(`[checar-saque] Erro ao atualizar dados do pedido "${id}":`, error)
            }
        }

        setInterval(async () => {
            try {
                if (dbs.get("sistema") === "OFF") return;
                const historico = await dbs.get("historico") || []

                for (const solicita of historico) {
                    try {
                        const id = solicita.id
                        const userId = solicita.userId
                        const valor = solicita.valor
                        const status = solicita.status

                        if (status === "aprovado" || status === "recusado") continue;
                        if (!id) continue;

                        const user = client.users.cache.get(userId)

                        axios.post('https://zendapplications.com/api/saque/verificar', {
                            id: id
                        }).then(async (response) => {
                            try {
                                const data = response.data;

                                if (data.status === "aprovado") {
                                    const embed = new EmbedBuilder()
                                        .setColor("#008000")
                                        .setDescription(`Olá ${user ?? "usuário"}. 👋\n- A solicitação de saque foi aprovada! Veja as informações à seguir:`)
                                        .setFields(
                                            { name: `Valor:`, value: `R$${valor}`, inline: true },
                                            { name: `Status:`, value: `\`🟢 ${data.status}\``, inline: true },
                                            { name: `ID:`, value: `- \`${data.idSaque}\``, inline: true }
                                        )
                                        .setFooter({ text: "Sistema da Zend Applications - Todos os Direitos Reservados" })
                                        .setTimestamp();
                                    await atualizarDados(id, "aprovado")
                                    if (user) {
                                        embed.setAuthor({ name: "Saque aprovado", iconURL: user.displayAvatarURL() })
                                        await user.send({ embeds: [embed] }).catch(dmError => {
                                            console.error(`[checar-saque] Não foi possível enviar DM de aprovação para ${userId}:`, dmError)
                                        });
                                    }
                                }

                                if (data.status === "recusado") {
                                    const embed = new EmbedBuilder()
                                        .setColor("#FF0000")
                                        .setDescription(`Olá ${user ?? "usuário"}. 👋\n- A solicitação de saque foi aprovada! Veja as informações à seguir:`)
                                        .setFields(
                                            { name: `Valor:`, value: `R$${valor}`, inline: false },
                                            { name: `Status:`, value: `\`🔴 ${data.status}\``, inline: true },
                                            { name: `Motivo:`, value: `${data.motivo}`, inline: true },
                                            { name: `ID:`, value: `- \`${data.idSaque}\``, inline: true }
                                        )
                                        .setFooter({ text: "Sistema da Zend Applications - Todos os Direitos Reservados" })
                                        .setTimestamp();
                                    const valorizado = typeof valor === "string" ? valor.replace(",", ".") : valor
                                    await atualizarDados(id, "recusado", valorizado)

                                    if (user) {
                                        embed.setAuthor({ name: "Saque recusado", iconURL: user.displayAvatarURL() })
                                        await user.send({ embeds: [embed] }).catch(dmError => {
                                            console.error(`[checar-saque] Não foi possível enviar DM de recusa para ${userId}:`, dmError)
                                        });
                                    }
                                }
                            } catch (innerError) {
                                console.error(`[checar-saque] Erro ao processar resposta da verificação de saque "${id}":`, innerError)
                            }
                        }).catch(error => {
                            console.error('[checar-saque] Erro ao fazer a requisição:', error);
                        });
                    } catch (loopError) {
                        console.error(`[checar-saque] Erro ao processar item do histórico:`, loopError)
                    }
                }
            } catch (intervalError) {
                console.error(`[checar-saque] Erro no ciclo de verificação de saques:`, intervalError)
            }
        }, 1000 * 10);
    }
}
