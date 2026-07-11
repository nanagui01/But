const Discord = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json"})
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json"})
module.exports = {
    name: `nuke`,
    description: `🤖 | Recrie o chat atual.`,
    type: Discord.ApplicationCommandType.ChatInput,

    run: async(client, interaction) => {
        if(!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageChannels)) 
        return interaction.reply({ ephemeral:true, content: `${dbe.get(`13`)} | Você não tem permissão para usar este comando!`})
        await interaction.reply({
            content:`${dbe.get(`16`)} | Aguarde um momento..`
        });
        const channel = interaction.channel;
        const channelPosition = channel.position;
        const newChannel = await channel.clone();

        await channel.delete();
        await newChannel.setPosition(channelPosition);
        await newChannel.send(`${dbe.get(`6`)} | Canal nukado por ${interaction.user} (\`${interaction.user.username} - ${interaction.user.id}\`)!`).then((msg) => setTimeout(() => { msg.delete() }, 1000 * 20));
    }
}