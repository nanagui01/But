const { JsonDatabase } = require("wio.db");
const Discord = require("discord.js");
const { joinVoiceChannel } = require('@discordjs/voice');

const dbe = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dbp = new JsonDatabase({ databasePath: "./json/perms.json" });

module.exports = {
    name: `conectar`,
    description: `🤖 | Conecte o bot em uma call.`,
    type: Discord.ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'canal',
            description: 'Selecione o canal de voz para conectar o bot',
            type: Discord.ApplicationCommandOptionType.Channel,
            required: true,
            channel_types: [Discord.ChannelType.GuildVoice]
        }
    ],

    run: async (client, interaction) => {
        if (interaction.user.id !== dbp.get(`${interaction.user.id}`)) {
            return interaction.reply({ ephemeral: true, content: `${dbe.get(`13`)} | Você não tem permissão para usar este comando!` });
        }

        const canal = interaction.options.getChannel('canal');

        try {
            joinVoiceChannel({
                channelId: canal.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });

            interaction.reply({ content: `\`🟢\` Conectado ao canal de voz **${canal.name}** com exito!`, ephemeral: true });
        } catch (error) {
            console.error("Erro ao conectar:", error);
            interaction.reply({ ephemeral: true, content: `❌ | Ocorreu um erro ao tentar conectar ao canal de voz.` });
        }
    }
};

