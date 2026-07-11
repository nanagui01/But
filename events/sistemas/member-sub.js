const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder} = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbp = new JsonDatabase({ databasePath: "./json/personalizados.json"})
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json"})
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json"})
const Discord = require("discord.js")
const db = new JsonDatabase({ databasePath: "./json/produtos.json"})
const dbep = new JsonDatabase({ databasePath: "./json/emojisGlob.json"})

module.exports = {
    name: "guildMemberRemove",
    run: async (client) => {
        try {
            // "client" aqui é na verdade o objeto member recebido pelo evento (mantido o nome original para não quebrar nada que dependa dele externamente)
            const member = client

            if (!member || !member.guild || !member.user) {
                console.error("[guildMemberRemove] Objeto member inválido ou incompleto recebido pelo evento.")
                return
            }

            const canalId = dbc.get("logs.entrada.saiu")
            if (!canalId) {
                // Nenhum canal configurado para log de saída, encerra silenciosamente
                return
            }

            const canal = member.guild.channels.cache.get(canalId)
            if (!canal) {
                console.error(`[guildMemberRemove] Canal de log de saída (${canalId}) não encontrado ou bot sem acesso.`)
                return
            }

            const nomeUsuario = member.user.username ?? "Desconhecido"
            let tempoNoDiscord = "Indisponível."

            try {
                const dataCriacao = new Date(member.user.createdAt).setHours(0, 0, 0, 0)
                const dataAtual = new Date()
                const diffEmMilissegundos = Math.abs(dataAtual - dataCriacao)
                const diffEmDias = Math.floor(diffEmMilissegundos / (1000 * 60 * 60 * 24))
                tempoNoDiscord = `${diffEmDias} dias no Discord.`
            } catch (dateError) {
                console.error("[guildMemberRemove] Erro ao calcular tempo de conta:", dateError)
            }

            const embed = new EmbedBuilder()
                .setAuthor({ name: `Saida de Membro!`, iconURL: member.user.displayAvatarURL() })
                .setThumbnail(member.user.displayAvatarURL())
                .setColor("Red")
                .setFields(
                    { name: `Usuário:`, value: `\`${nomeUsuario} - ${member.user.id}\``, inline: true },
                    { name: `Tempo da conta:`, value: `${tempoNoDiscord}`, inline: true },
                )
                .setFooter({ text: `Servidor: ${member.guild.name}` })
                .setTimestamp()

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("teste")
                        .setDisabled(true)
                        .setStyle(2)
                        .setLabel("Mensagem Automática")
                        .setEmoji(dbep.get(`5`))
                )

            await canal.send({ content: `${member.client?.user ?? ""}`, embeds: [embed], components: [row] })
                .catch(sendError => {
                    console.error("[guildMemberRemove] Falha ao enviar embed de saída de membro:", sendError)
                })

        } catch (error) {
            console.error("[guildMemberRemove] Erro inesperado no handler:", error)
        }
    }
}
