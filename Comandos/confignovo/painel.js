const {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle
} = require("discord.js");

const { JsonDatabase } = require("wio.db");


const dbp = new JsonDatabase({
    databasePath: "./json/perms.json"
});

const pkg = new JsonDatabase({
    databasePath: "./package.json"
});

const dbe = new JsonDatabase({
    databasePath: "./json/emojis.json"
});

const dbc = new JsonDatabase({
    databasePath: "./json/botconfig.json"
});

const dbep = new JsonDatabase({
    databasePath: "./json/emojisGlob.json"
});

const cfg = new JsonDatabase({
    databasePath: "./json/configGlob.json"
});


module.exports = {

    name: "painel",

    description: "Configure o seu bot",

    type: ApplicationCommandType.ChatInput,


    options: [

        {
            name: "bot",
            description: "🤖 | Configure o seu bot.",
            type: ApplicationCommandOptionType.Subcommand
        },

        {
            name: "vendas",
            description: "🤖 | Configure produtos, cupons e personalize seu painel.",
            type: ApplicationCommandOptionType.Subcommand
        }

    ],



    run: async (client, interaction) => {


        // ==========================
        // RESPOSTA INICIAL
        // ==========================

        try {

            await interaction.deferReply({
                ephemeral: true
            });


        } catch (error) {

            console.log(
                "[PAINEL] Interação expirada:",
                error.message
            );

            return;

        }



        try {


            // ==========================
            // PERMISSÃO
            // ==========================


            if (!dbp.has(interaction.user.id)) {


                return await interaction.editReply({

                    content:
                    `${dbe.get("13") || "❌"} | Você não possui permissão para usar este comando.`

                });


            }



            const subcommand =
            interaction.options.getSubcommand();



            // ==========================
            // PAINEL DE VENDAS
            // ==========================


            if (subcommand === "vendas") {



                const color =
                dbc.get("color") || 0x2b2d31;


                const embed =
                new EmbedBuilder()

                .setAuthor({

                    name:"Configurando Vendas",

                    iconURL:
                    interaction.user.displayAvatarURL({
                        dynamic:true
                    })

                })


                .setColor(color)


                .setDescription(

                    `Olá ${interaction.user} 👋\n\n` +
                    `Escolha abaixo qual sistema deseja configurar.`

                )


                .setTimestamp();



                const img =
                cfg.get("imgVendas");


                if(img)
                    embed.setImage(img);



                if(interaction.guild?.iconURL()){

                    embed.setThumbnail(
                        interaction.guild.iconURL({
                            dynamic:true
                        })
                    );

                }




                const row1 =
                new ActionRowBuilder()
                .addComponents(


                    new ButtonBuilder()

                    .setCustomId(
                        "config_produtos"
                    )

                    .setLabel(
                        "Painéis"
                    )

                    .setStyle(
                        ButtonStyle.Primary
                    )

                    .setEmoji(
                        dbep.get("35") || "🛒"
                    ),




                    new ButtonBuilder()

                    .setCustomId(
                        "config_perso"
                    )

                    .setLabel(
                        "Personalizar"
                    )

                    .setStyle(
                        ButtonStyle.Primary
                    )

                    .setEmoji(
                        dbep.get("5") || "⚙️"
                    )


                );




                const row2 =
                new ActionRowBuilder()
                .addComponents(


                    new ButtonBuilder()

                    .setCustomId(
                        "config_cupom"
                    )

                    .setLabel(
                        "Cupons"
                    )

                    .setStyle(
                        ButtonStyle.Primary
                    )

                    .setEmoji(
                        dbep.get("24") || "🎟️"
                    ),




                    new ButtonBuilder()

                    .setCustomId(
                        "config_rendimentos"
                    )

                    .setLabel(
                        "Rendimentos"
                    )

                    .setStyle(
                        ButtonStyle.Primary
                    )

                    .setEmoji(
                        dbep.get("3") || "💰"
                    )


                );





                const row3 =
                new ActionRowBuilder()
                .addComponents(


                    new ButtonBuilder()

                    .setCustomId(
                        "config_hierarquiacargo"
                    )

                    .setLabel(
                        "Hierarquia de Cargos"
                    )

                    .setStyle(
                        ButtonStyle.Primary
                    )

                    .setEmoji(
                        dbep.get("24") || "🎟️"
                    )


                );




                return await interaction.editReply({

                    embeds:[
                        embed
                    ],

                    components:[
                        row1,
                        row2,
                        row3
                    ]

                });



            }






            // ==========================
            // PAINEL DO BOT
            // ==========================



            if(subcommand === "bot"){



                const color =
                dbc.get("color") || 0x2b2d31;



                const embed =
                new EmbedBuilder()


                .setAuthor({

                    name:
                    "Configurando Bot",

                    iconURL:
                    interaction.user.displayAvatarURL({
                        dynamic:true
                    })

                })


                .setColor(color)


                .setDescription(

                    `Olá ${interaction.user} 👋\n\n` +
                    `Selecione abaixo uma opção para configurar.`

                )


                .addFields(

                    {

                        name:
                        "Versão",

                        value:
                        `\`${pkg.get("version") || "1.0.0"}\``,

                        inline:true

                    },


                    {

                        name:
                        "Latência",

                        value:
                        `${client.ws.ping}ms`,

                        inline:true

                    }

                )


                .setTimestamp();




                const row1 =
                new ActionRowBuilder()
                .addComponents(


                    new ButtonBuilder()

                    .setCustomId(
                        "config_bot"
                    )

                    .setLabel(
                        "Bot"
                    )

                    .setStyle(
                        ButtonStyle.Primary
                    )

                    .setEmoji(
                        dbep.get("10") || "🤖"
                    ),




                    new ButtonBuilder()

                    .setCustomId(
                        "config_pagamentos"
                    )

                    .setLabel(
                        "Gerenciar Financeiro"
                    )

                    .setStyle(
                        ButtonStyle.Primary
                    )

                    .setEmoji(
                        dbep.get("9") || "💵"
                    )


                );




                const row2 =
                new ActionRowBuilder()
                .addComponents(


                    new ButtonBuilder()

                    .setCustomId(
                        "config_mod"
                    )

                    .setLabel(
                        "Gerenciar Sistemas"
                    )

                    .setStyle(
                        ButtonStyle.Primary
                    )

                    .setEmoji(
                        dbep.get("22") || "🔧"
                    ),



                    new ButtonBuilder()

                    .setCustomId(
                        "config_auth"
                    )

                    .setLabel(
                        "Auth"
                    )

                    .setDisabled(true)

                    .setStyle(
                        ButtonStyle.Primary
                    )

                    .setEmoji(
                        dbep.get("44") || "🔐"
                    )


                );




                return await interaction.editReply({

                    embeds:[
                        embed
                    ],

                    components:[
                        row1,
                        row2
                    ]

                });


            }



        } catch(error){



            console.error(
                "[PAINEL] Erro:",
                error
            );



            if(interaction.deferred || interaction.replied){


                try{

                    await interaction.editReply({

                        content:
                        "❌ Ocorreu um erro interno ao executar este comando."

                    });


                }catch(e){

                    console.log(
                        "[PAINEL] Não foi possível editar resposta:",
                        e.message
                    );

                }


            }


        }


    }


};