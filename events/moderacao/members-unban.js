const { EmbedBuilder, AuditLogEvent } = require("discord.js");
const { JsonDatabase } = require("wio.db");

const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json" });

module.exports = {
    name: "guildBanRemove",
    run: async (ban) => {
        if (!ban.guild) return;

        const logChannel = ban.guild.channels.cache.get(dbc.get("logsStaff.channel"));
        if (!logChannel) return; // Verifica se o canal de logs existe

        if (dbc.get("logsStaff.members") !== "ON") return;

        // Obtém o log de auditoria para verificar quem removeu o ban
        const fetchedLogs = await ban.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberBanRemove,
        });

        const unbanLog = fetchedLogs.entries.first();
        if (!unbanLog) return;

        const { executor } = unbanLog; // Executor do desbanimento

        // Criando o embed de log
        const embed = new EmbedBuilder()
            .setAuthor({ name: `✅ Usuário Desbanido!`, iconURL: ban.user.displayAvatarURL() })
            .setColor("00FF00")
            .setDescription(`**Desbanido por:** ${executor}`)
            .addFields(
                { name: "👤 Usuário Desbanido:", value: `- \`👋\` Menção: ${ban.user}\n- \`📇\` Nome: ${ban.user.username}\n- \`🆔\` ID do usuário: ${ban.user.id}`, inline: true },
                { name: "📅 Data do Desbanimento:", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setFooter({ text: `Servidor: ${ban.guild.name}` })
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
    },
};
