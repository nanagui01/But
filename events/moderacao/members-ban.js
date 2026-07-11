const { EmbedBuilder, AuditLogEvent } = require("discord.js");
const { JsonDatabase } = require("wio.db");

const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json" });

module.exports = {
    name: "guildBanAdd",
    run: async (ban) => {
        if (!ban.guild) return;

        const logChannel = ban.guild.channels.cache.get(dbc.get("logsStaff.channel"));
        if (!logChannel) return console.log("Canal não definido"); // Verifica se o canal de logs existe

        if (dbc.get("logsStaff.members") !== "ON") return;

        // Obtém o log de auditoria para verificar quem baniu o usuário
        const fetchedLogs = await ban.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberBanAdd,
        });

        const banLog = fetchedLogs.entries.first();
        if (!banLog) return;

        const { executor, reason } = banLog; // Executor do banimento e motivo (se houver)

        // Criando o embed de log
        const embed = new EmbedBuilder()
            .setAuthor({ name: `⛔ Usuário Banido!`, iconURL: ban.user.displayAvatarURL() })
            .setColor("FF0000")
            .setDescription(`**Banido por:** ${executor}\n**Motivo:** \`\`\`${reason || "*Sem motivo especificado*"}\`\`\``)
            .addFields(
                { name: "👤 Usuário Banido:", value: `- \`👋\` Menção: ${ban.user}\n- \`📇\` Nome: ${ban.user.username}\n- \`🆔\` ID do usuário: ${ban.user.id}`, inline: true },
                { name: "📅 Data do Banimento:", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setFooter({ text: `Servidor: ${ban.guild.name}` })
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
    },
};
