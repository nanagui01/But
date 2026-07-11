const Discord = require("discord.js");
const { JsonDatabase } = require("wio.db");

const {
    EmbedBuilder,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder
} = require("discord.js");

const dbp = new JsonDatabase({
    databasePath: "./json/perms.json"
});

const dbe = new JsonDatabase({
    databasePath: "./json/emojis.json"
});

const dono = new JsonDatabase({
    databasePath: "./config.json"
});

module.exports = {
    name: "setdono",
    description: "🤖 | Seta a pessoa que usou como dono do BOT.",
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {

        const emojiSucesso = dbe.get("6") || "✅";
        const emojiErro = dbe.get("13") || "❌";


        try {

            // PRIMEIRA CONFIGURAÇÃO
            if (!dono.get("setdono")) {


                const modal = new ModalBuilder()
                    .setCustomId("senharecupera")
                    .setTitle("SENHA DE RECUPERAÇÃO");


                const input = new TextInputBuilder()
                    .setCustomId("text")
                    .setLabel("COLOQUE UMA SENHA")
                    .setPlaceholder("Senha para recuperar o dono")
                    .setMinLength(4)
                    .setStyle(Discord.TextInputStyle.Short);


                modal.addComponents(
                    new ActionRowBuilder()
                        .addComponents(input)
                );


                await interaction.showModal(modal);


                const submitted = await interaction.awaitModalSubmit({

                    time: 600000,

                    filter: i =>
                        i.user.id === interaction.user.id &&
                        i.customId === "senharecupera"

                }).catch(() => null);



                if (!submitted) {
                    return;
                }



                const senha = submitted.fields.getTextInputValue("text");



                dono.set("dono", interaction.user.id);
                dono.set("senha", senha);
                dono.set("setdono", "setado");


                dbp.set(
                    interaction.user.id,
                    interaction.user.id
                );



                await submitted.reply({

                    content:
                    `${emojiSucesso} | Dono ${interaction.user} configurado com sucesso!`,

                    ephemeral: true

                });



                try {

                    await interaction.user.send(
                        `# Senha de recuperação\n\nSua senha é:\n\`${senha}\``
                    );

                } catch(e){

                    console.log(
                        "[SETDONO] Não consegui enviar DM."
                    );

                }



            }



            // RECUPERAÇÃO
            else {


                const modal = new ModalBuilder()

                    .setCustomId("recuperarbot")
                    .setTitle("SENHA DE RECUPERAÇÃO");



                const input = new TextInputBuilder()

                    .setCustomId("text")
                    .setLabel("COLOQUE A SENHA")
                    .setPlaceholder("Senha definida anteriormente")
                    .setMinLength(4)
                    .setStyle(Discord.TextInputStyle.Short);



                modal.addComponents(

                    new ActionRowBuilder()
                    .addComponents(input)

                );



                await interaction.showModal(modal);



                const submitted =
                await interaction.awaitModalSubmit({

                    time:600000,

                    filter:i =>
                    i.user.id === interaction.user.id &&
                    i.customId === "recuperarbot"

                }).catch(()=>null);



                if(!submitted){
                    return;
                }



                const senhaDigitada =
                submitted.fields.getTextInputValue("text");



                const senhaCorreta =
                dono.get("senha");




                if(senhaDigitada === senhaCorreta){


                    dono.delete("dono");
                    dono.delete("senha");
                    dono.delete("setdono");


                    dbp.deleteAll();


                    dbp.set(
                        interaction.user.id,
                        interaction.user.id
                    );



                    await submitted.reply({

                        content:
                        `${emojiSucesso} | Senha correta! O dono anterior foi removido.`,

                        ephemeral:true

                    });



                } else {


                    await submitted.reply({

                        content:
                        `${emojiErro} | Senha incorreta!`,

                        ephemeral:true

                    });


                }

            }



        } catch(error){


            console.error(
                "[SETDONO] Erro:",
                error
            );



            // Só tenta responder se ainda puder

            try {


                if(
                    !interaction.replied &&
                    !interaction.deferred
                ){

                    await interaction.reply({

                        content:
                        "❌ | Ocorreu um erro interno.",

                        ephemeral:true

                    });

                }


            }catch(e){

                console.error(
                    "[SETDONO] Erro ao responder:",
                    e
                );

            }

        }

    }
};