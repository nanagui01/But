const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, Attachment, AttachmentBuilder} = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json"})
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json"})
const dbp = new JsonDatabase({ databasePath: "./json/personalizados.json"})
const dbpp = new JsonDatabase({ databasePath: "./json/perms.json"})
const db = new JsonDatabase({ databasePath: "./json/produtos.json"})
const Discord = require("discord.js")
const { updateEspecifico, sendMessage } = require("../../Functions/UpdateMessageBuy")
module.exports = {
    name: "set", // Coloque o nome do comando
    description: "🤖 | Envie o painel de compra.", // Coloque a descrição do comando
    type: Discord.ApplicationCommandType.ChatInput,
    options: [
        {
            name: "painel",
            description: "Escolha um painel.",
            type: Discord.ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true,
        }
    ],
    async autocomplete(interaction) {
        const value = interaction.options.getFocused().toLowerCase();
        let choices = db.all().filter(pd => pd.data.id)
    
        const filtered = choices.filter(choice => choice.data.id.toLowerCase().includes(value)).slice(0, 25);
    
        if(!interaction) return;
        if(choices.length === 0){ 
            await interaction.respond([
                { name: "Nenhum produto foi criado!", value: "a29183912asd92384XASDASDSADASDSADASDASD12398212222" }
            ])
        } else if(filtered.length === 0) {
            await interaction.respond([
                { name: "Não Achei Nenhum produto", value: "a29183912asd92384XASDASDSADASDSADASDASD1239821" }
            ]);
        } else {
            await interaction.respond(
                filtered.map(choice => ({name: `ID  - ${choice.data.id} | Nome -  ${choice.data.titulo}`, value: choice.data.id}))
            );
        }
    },  
    run: async (client, interaction) => {
        const a = interaction.options.getString("painel");
        if (interaction.user.id !== dbpp.get(`${interaction.user.id}`)) {
            interaction.reply({ ephemeral:true, content: `${dbe.get(`13`)} | Você não tem permissão para usar este comando!`})
            return;
        }
        sendMessage(interaction, a, interaction.channel.id).then(() => {
            interaction.reply({ content: `${dbe.get(`6`)} | Mensagem Enviada!`, ephemeral:true})
        }).catch((err) => {
            console.log(err)
            interaction.reply({ content: `${dbe.get(`13`)} | Mensagem não Enviada!`, ephemeral:true})
        })
    }
}