const { EmbedBuilder, AuditLogEvent, AttachmentBuilder } = require("discord.js");
const { JsonDatabase } = require("wio.db");

const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json" });
const dbep = new JsonDatabase({ databasePath: "./json/emojisGlob.json" });
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json" });

module.exports = {
    name: "messageUpdate",
    run: async (oldMessage, newMessage) => {
        if (!newMessage.guild) return; // Ignora DMs

        const logChannel = newMessage.guild.channels.cache.get(dbc.get("logsStaff.channel"));
        if (!logChannel) return; // Verifica se o canal de logs existe

        if (dbc.get("logsStaff.messages") !== "ON") return;

        if (newMessage.author.bot) return;

        // Pega o log da auditoria de quem editou
        const fetchedLogs = await newMessage.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MessageUpdate,
        });

        const updateLog = fetchedLogs.entries.first();
        if (!updateLog) return;

        const { executor } = updateLog;

        // Cria o Embed básico
        const embed = new EmbedBuilder()
            .setAuthor({ name: `✏️ Mensagem Editada!`, iconURL: newMessage.author.displayAvatarURL() })
            .setColor("FFA500")
            .setDescription(`\n**Mensagem Original:**\n\`\`\`${oldMessage.content || "*Sem conteúdo*"}\`\`\`\n**Mensagem Atual:**\n\`\`\`${newMessage.content || "*Sem conteúdo*"}\`\`\``)
            .addFields(
                { name: "👤 Autor:", value: `- \`👋\` Menção: ${newMessage.author}\n- \`📇\` Nome: ${newMessage.author.username}\n- \`🆔\` ID do usuário: ${newMessage.author.id}`, inline:true },
                { name: `📃 Informações da mensagem:`, value: `- \`📺\` Canal enviado: <#${newMessage.channel.id}>\n- \`⏰\` Foi enviada: <t:${Math.floor(newMessage.createdTimestamp / 1000)}:R>\n- \`🖼️\` Imagens anexadas: ${newMessage.attachments.size > 0 ? "`🟢 Tinha imagens, tudo anexado acima.`" : "`🔴 Sem imagens`"}`, inline:true },
            )
            .setFooter({ text: `Canal: #${newMessage.channel.name}` })
            .setTimestamp();

        // Adiciona os anexos, caso haja
        if (newMessage.attachments.size > 0) {
            const attachments = newMessage.attachments.map(attachment => new AttachmentBuilder(attachment.url));
            logChannel.send({ embeds: [embed], files: attachments });
        } else {
            logChannel.send({ embeds: [embed] });
        }
    },
};
