const Discord = require("discord.js");
const { ModalBuilder, TextInputBuilder, ActionRowBuilder } = require("discord.js");
const { JsonDatabase } = require("wio.db");

const dbe = new JsonDatabase({
    databasePath: "./json/emojis.json"
});

const dbp = new JsonDatabase({
    databasePath: "./json/perms.json"
});


module.exports = {
    name: "status",
    description: "🤖 | Mude os meus status.",
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {

        try {

            const emojiErro = dbe.get("13") || "❌";

            // Permissão
            if (!dbp.has(interaction.user.id)) {

                return interaction.reply({
                    content: `${emojiErro} | Você não tem permissão para usar este comando!`,
                    flags: Discord.MessageFlags.Ephemeral
                });

            }


            const modal = new ModalBuilder()
                .setCustomId("modalconfigstatus")
                .setTitle("Alterar Status do BOT");


            const presenceInput = new TextInputBuilder()
                .setCustomId("presence")
                .setLabel("TIPO DE PRESENÇA")
                .setPlaceholder("online, ausente, invisivel ou ocupado")
                .setRequired(true)
                .setStyle(Discord.TextInputStyle.Short);


            const atividadeInput = new TextInputBuilder()
                .setCustomId("atividade")
                .setLabel("TIPO DE ATIVIDADE")
                .setPlaceholder("jogando, assistindo, competindo, transmitindo, ouvindo")
                .setRequired(true)
                .setStyle(Discord.TextInputStyle.Short);


            const textoInput = new TextInputBuilder()
                .setCustomId("text_ativd")
                .setLabel("TEXTO DA ATIVIDADE")
                .setPlaceholder("Ex: Servidor de vendas")
                .setRequired(true)
                .setStyle(Discord.TextInputStyle.Short);


            const urlInput = new TextInputBuilder()
                .setCustomId("url")
                .setLabel("URL DA TRANSMISSÃO")
                .setPlaceholder("Obrigatório somente em transmitir")
                .setRequired(false)
                .setStyle(Discord.TextInputStyle.Short);



            modal.addComponents(
                new ActionRowBuilder().addComponents(presenceInput),
                new ActionRowBuilder().addComponents(atividadeInput),
                new ActionRowBuilder().addComponents(textoInput),
                new ActionRowBuilder().addComponents(urlInput)
            );


            // IMPORTANTE: sem defer antes
            await interaction.showModal(modal);



            const submitted = await interaction.awaitModalSubmit({

                time: 600000,

                filter: i =>
                    i.user.id === interaction.user.id &&
                    i.customId === "modalconfigstatus"

            }).catch(() => null);



            if (!submitted) return;



            await submitted.reply({

                content: "⏳ Alterando status...",
                flags: Discord.MessageFlags.Ephemeral

            });



            const presenceMap = {

                "online": "online",
                "ausente": "idle",
                "invisivel": "invisible",
                "ocupado": "dnd"

            };


            const activityMap = {

                "jogando": Discord.ActivityType.Playing,
                "assistindo": Discord.ActivityType.Watching,
                "competindo": Discord.ActivityType.Competing,
                "transmitindo": Discord.ActivityType.Streaming,
                "ouvindo": Discord.ActivityType.Listening

            };



            const presence =
                submitted.fields.getTextInputValue("presence")
                .toLowerCase();


            const activity =
                submitted.fields.getTextInputValue("atividade")
                .toLowerCase();


            const text =
                submitted.fields.getTextInputValue("text_ativd");


            const url =
                submitted.fields.getTextInputValue("url") || null;



            if (!presenceMap[presence]) {

                return submitted.editReply({
                    content:
                    "❌ Presença inválida. Use: online, ausente, invisivel ou ocupado."
                });

            }



            if (!activityMap[activity]) {

                return submitted.editReply({
                    content:
                    "❌ Atividade inválida. Use: jogando, assistindo, competindo, transmitindo ou ouvindo."
                });

            }



            if (activity === "transmitindo" && !url) {

                return submitted.editReply({
                    content:
                    "❌ Informe a URL da Twitch para usar transmissão."
                });

            }



            client.user.setPresence({

                status: presenceMap[presence],

                activities: [

                    {
                        name: text,
                        type: activityMap[activity],
                        url: activity === "transmitindo" ? url : undefined
                    }

                ]

            });



            await submitted.editReply({

                content:
                `✅ Status alterado com sucesso!\n\n` +
                `🟢 Presença: ${presence}\n` +
                `🎮 Atividade: ${activity}\n` +
                `📝 Texto: ${text}`

            });



        } catch(error){

            console.error("[STATUS] Erro:", error);


            if(!interaction.replied && !interaction.deferred){

                interaction.reply({

                    content:"❌ Erro ao alterar status.",
                    flags: Discord.MessageFlags.Ephemeral

                }).catch(()=>{});

            }

        }

    }
};