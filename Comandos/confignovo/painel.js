const { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const { JsonDatabase } = require("wio.db");

const dbp = new JsonDatabase({ databasePath: "./json/perms.json" });
const pkg = new JsonDatabase({ databasePath: "./package.json" });
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json" });
const dbep = new JsonDatabase({ databasePath: "./json/emojisGlob.json" });
const cfg = new JsonDatabase({ databasePath: "./json/configGlob.json" });

module.exports = {
    name: "painel",
    description: "Configure o seu bot",
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
        // Defer para ganhar tempo e garantir resposta ephemeral
        await interaction.deferReply({ ephemeral: true }).catch(err => {
            console.error(`[PAINEL] Erro ao deferir a interação:`, err);
            return; // Já evita continuar se não foi possível deferir
        });

        try {
            // Verificação de permissão corrigida: apenas IDs registrados no banco
            if (!dbp.has(interaction.user.id)) {
                const emojiPerm = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiPerm} | Você não tem permissão para usar este comando!`
                });
            }

            const subcommand = interaction.options.getSubcommand();

            if (subcommand === "vendas") {
                // Fallbacks e validações
                const color = dbc.get("color") || 0x2b2d31; // cor padrão segura
                const imgVendas = cfg.get("imgVendas") || null;
                const thumb = interaction.guild?.iconURL({ dynamic: true }) || null;

                const embed = new EmbedBuilder()
                    .setAuthor({ name: "Configurando Vendas", iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                    .setColor(color)
                    .setDescription(`Olá ${interaction.user} 👋.\n- Escolha abaixo qual sistema de vendas você deseja configurar.`)
                    .setTimestamp();

                if (thumb) embed.setThumbnail(thumb);
                if (imgVendas) embed.setImage(imgVendas);

                const emjcai = dbep.get(`35`) || '🛒';
                const emjfer = dbep.get(`5`)  || '⚙️';
                const emjbol = dbep.get(`3`)  || '💰';
                const emjCupom = dbep.get(`24`) || '🎟️';

                const row1 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setStyle(1).setCustomId(`config_produtos`).setLabel(`Painéis`).setEmoji(emjcai),
                    new ButtonBuilder().setStyle(1).setCustomId(`config_perso`).setLabel("Personalizar").setEmoji(emjfer),
                );

                const row2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setStyle(1).setCustomId("config_cupom").setLabel("Cupons").setDisabled(false).setEmoji(emjCupom),
                    new ButtonBuilder().setStyle(1).setCustomId(`config_rendimentos`).setLabel("Rendimentos").setEmoji(emjbol),
                );

                const row3 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setStyle(1).setCustomId(`config_hierarquiacargo`).setLabel("Hierarquia de Cargos").setEmoji(emjCupom),
                );

                await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
            }

            else if (subcommand === "bot") {
                const color = dbc.get("color") || 0x2b2d31;
                const imgConfig = cfg.get("imgConfig") || null;
                const version = pkg.get(`version`) || '1.0.0';
                const ping = client.ws.ping;
                const thumb = interaction.guild?.iconURL({ dynamic: true }) || null;

                const embed = new EmbedBuilder()
                    .setAuthor({ name: "Configurando Bot", iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                    .setColor(color)
                    .setDescription(`Olá ${interaction.user} 👋.\n- Selecione abaixo qual opção você deseja configurar.`)
                    .addFields(
                        { name: `Versão:`, value: `\`${version}\``, inline: true },
                        { name: "Latência", value: `${ping} ms`, inline: true }
                    )
                    .setTimestamp();

                if (thumb) embed.setThumbnail(thumb);
                if (imgConfig) embed.setImage(imgConfig);

                const emjeng = dbep.get(`10`) || '🤖';
                const emjdin = dbep.get(`9`)  || '💵';
                const emjesc = dbep.get(`22`) || '🔧';
                const emjAuth = dbep.get("44") || '🔐';

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setStyle(1).setCustomId(`config_bot`).setLabel(`Bot`).setEmoji(emjeng),
                    new ButtonBuilder().setStyle(1).setCustomId(`config_pagamentos`).setLabel("Gerenciar Financeiro").setEmoji(emjdin),
                );

                const row2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setStyle(1).setCustomId(`config_mod`).setLabel("Gerenciar Sistemas").setEmoji(emjesc),
                    new ButtonBuilder().setStyle(1).setCustomId("config_auth").setDisabled(true).setLabel("Auth").setEmoji(emjAuth),
                );

                await interaction.editReply({ embeds: [embed], components: [row, row2] });
            }
        } catch (error) {
            console.error(`[PAINEL] Erro na execução do comando:`, error);
            // Tenta responder com mensagem amigável, se a interação ainda não foi finalizada
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: '❌ Ocorreu um erro interno ao executar o comando. Tente novamente mais tarde.' });
                } else {
                    await interaction.reply({ content: '❌ Erro inesperado.', ephemeral: true });
                }
            } catch (replyError) {
                console.error(`[PAINEL] Falha ao enviar mensagem de erro:`, replyError);
            }
        }
    }
};