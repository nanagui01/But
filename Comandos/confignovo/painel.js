const Discord = require("discord.js")
const { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbp = new JsonDatabase({ databasePath: "./json/perms.json"})
const pkg = new JsonDatabase({ databasePath: "./package.json"})
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json"})
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json"})
const dbep = new JsonDatabase({ databasePath: "./json/emojisGlob.json"})
const cfg = new JsonDatabase({ databasePath: "./json/configGlob.json"})

module.exports = {
    name: "painel", // Coloque o nome do comando
    description: "Configue o seu bot", // Coloque a descrição do comando
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "bot",
            description: "🤖 | Configure o seu bot.",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "vendas",
            description: "🤖 | Configure produtos, cupons e personalize o seu painel de vendas.",
            type: ApplicationCommandOptionType.Subcommand,
        }
    ],

    run: async (client, interaction) => {
        if (interaction.user.id !== dbp.get(`${interaction.user.id}`)) {
            interaction.reply({ ephemeral:true, content: `${dbe.get(`13`)} | Você não tem permissão para usar este comando!`})
            return;
        }
        const subcommand = interaction.options.getSubcommand()
        if (subcommand === "vendas") {
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Vendas", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Escolha abaixo qual sistema de vendas você deseja configurar.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .setTimestamp()
            .setImage(cfg.get("imgVendas"))
            let emjcai = dbep.get(`35`)
            let emjfer = dbep.get(`5`)
            let emjbol = dbep.get(`3`)

            const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle(1)
                    .setCustomId(`config_produtos`)
                    .setLabel(`Painéis`)
                    .setEmoji(emjcai),
                new ButtonBuilder()
                    .setStyle(1)
                    .setCustomId(`config_perso`)
                    .setLabel("Personalizar")
                    .setEmoji(emjfer),
            );
            
            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setStyle(1)
                        .setCustomId("config_cupom")
                        .setLabel("Cupons")
                        .setDisabled(false)
                        .setEmoji(dbep.get(`24`)),
                    new ButtonBuilder()
                        .setStyle(1)
                        .setCustomId(`config_rendimentos`)
                        .setLabel("Rendimentos")
                        .setEmoji(emjbol),
                );
            const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_hierarquiacargo`)
                .setLabel("Hierarquia de Cargos")
                .setEmoji(dbep.get(`24`)),
            )
            // Remover botões vazios ou ajustá-los para manter a simetria
            interaction.reply({ embeds: [embed], components: [row1, row2, row3], content: "", ephemeral: true });
        }
        if (subcommand === "bot") {
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Bot", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Selecione abaixo qual opção você deseja configurar.`)
            .addFields(
                {
                    name: `Versão:`,
                    value: `\`${pkg.get(`version`)}\``,
                    inline:true
                },
                {
                    name: "Latência",
                    value: `${client.ws.ping} ms`,
                    inline:true
                }
            )
            .setTimestamp()
            .setImage(cfg.get("imgConfig"))
            
            let emjeng = dbep.get(`10`)
            let emjdin = dbep.get(`9`)
            let emjesc = dbep.get(`22`)

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_bot`)
                .setLabel(`Bot`)
                .setEmoji(emjeng),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos`)
                .setLabel("Gerenciar Financeiro")
                .setEmoji(emjdin),
            )
            const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel("Gerenciar Sistemas")
                .setEmoji(emjesc),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId("config_auth")
                .setDisabled(true)
                .setLabel("Auth")
                .setEmoji(dbep.get("44"))
            )
            interaction.reply({ embeds: [embed], components: [row, row2], content: "", ephemeral:true})
        }
    }
    }
