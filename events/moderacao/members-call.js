const { EmbedBuilder } = require("discord.js");
const { JsonDatabase } = require("wio.db");

const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json" });

module.exports = {
    name: "voiceStateUpdate",
    run: async (oldState, newState) => {
        const logChannel = oldState.guild.channels.cache.get(dbc.get("logsStaff.channel"));
        if (!logChannel) return; // Verifica se o canal de logs existe

        if (dbc.get("logsStaff.channelVoice") !== "ON") return;

        const user = newState.member || oldState.member;

        // Se entrou na call
        if (!oldState.channelId && newState.channelId) {
            const embedJoin = new EmbedBuilder()
                .setAuthor({ name: `🎤 Usuário entrou na call!`, iconURL: user.user.displayAvatarURL() })
                .setColor("00FF00")
                .setDescription(`**Usuário:** ${user}\n**Canal:** <#${newState.channelId}>`)
                .setFooter({ text: `ID do usuário: ${user.id}` })
                .setTimestamp();

            logChannel.send({ embeds: [embedJoin] });
        }

        // Se saiu da call
        else if (oldState.channelId && !newState.channelId) {
            const embedLeave = new EmbedBuilder()
                .setAuthor({ name: `📤 Usuário saiu da call!`, iconURL: user.user.displayAvatarURL() })
                .setColor("FF0000")
                .setDescription(`**Usuário:** ${user}\n**Canal:** <#${oldState.channelId}>`)
                .setFooter({ text: `ID do usuário: ${user.id}` })
                .setTimestamp();

            logChannel.send({ embeds: [embedLeave] });
        }
    },
};
