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
            const pedidos = await dbs.get("historico") || []
            const find = await pedidos.findIndex(a => a.id === id)
            pedidos[find].status = func
            if (func === "recusado") dbs.add(`saldo`, valor)
            await dbs.set("historico", pedidos)
        }
        setInterval(async() => {
            if (dbs.get("sistema") === "OFF") return;
            const historico = await dbs.get("historico") || []
            for (const solicita of historico) {
                const id = solicita.id
                const userId = solicita.userId
                const data = solicita.horario
                const valor = solicita.valor
                const status = solicita.status
                const motivo = solicita.motivo
                const user = client.users.cache.get(userId)
                if (status === "aprovado" || status === "recusado") continue;
                axios.post('https://zendapplications.com/api/saque/verificar', {
                    id: id
                }).then(async(response) => {
                    const data = response.data;
                    
                    if (data.status === "aprovado") {
                        const embed = new EmbedBuilder()
                        .setColor("#008000")
                        .setDescription(`Olá ${user}. 👋\n- A solicitação de saque foi aprovada! Veja as informações à seguir:`)
                        .setFields(
                            { name: `Valor:`, value: `R$${valor}`, inline: true },
                            { name: `Status:`, value: `\`🟢 ${data.status}\``, inline: true },
                            { name: `ID:`, value: `- \`${data.idSaque}\``, inline: true }
                        )
                        .setFooter({ text: "Sistema da Zend Applications - Todos os Direitos Reservados" })
                        .setTimestamp();
                        await atualizarDados(id, "aprovado")
                        if (user) {
                            await embed.setAuthor({ name: "Saque aprovado", iconURL: user.displayAvatarURL() })
                            user.send({ embeds: [embed]});
                        }
                    }
                    if (data.status === "recusado") {
                        const embed = new EmbedBuilder()
                        .setColor("#FF0000")
                        .setDescription(`Olá ${user}. 👋\n- A solicitação de saque foi aprovada! Veja as informações à seguir:`)
                        .setFields(
                            { name: `Valor:`, value: `R$${valor}`, inline: false },
                            { name: `Status:`, value: `\`🔴 ${data.status}\``, inline: true },
                            { name: `Motivo:`, value: `${data.motivo}`, inline: true },
                            { name: `ID:`, value: `- \`${data.idSaque}\``, inline: true }
                        )
                        .setFooter({ text: "Sistema da Zend Applications - Todos os Direitos Reservados" })
                        .setTimestamp();
                        const valorizado = valor.replace(",", ".")
                        await atualizarDados(id, "recusado", valorizado)

                        if (user) {
                            await embed.setAuthor({ name: "Saque recusado", iconURL: user.displayAvatarURL() })
                            user.send({ embeds: [embed]});
                        }

                    }
                }).catch(error => {
                    console.error('Erro ao fazer a requisição:', error);
                });
            }
        }, 1000 * 10);
    }
}
