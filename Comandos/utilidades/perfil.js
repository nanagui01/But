const { EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const Discord = require("discord.js");
const { JsonDatabase } = require("wio.db");

const dbe  = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dc   = new JsonDatabase({ databasePath: "./json/carrinho.json" });
const dbc  = new JsonDatabase({ databasePath: "./json/botconfig.json" });
const dbp  = new JsonDatabase({ databasePath: "./json/personalizados.json" });
const db   = new JsonDatabase({ databasePath: "./json/produtos.json" });
const dbr  = new JsonDatabase({ databasePath: "./json/rendimentos.json" });
const dbru = new JsonDatabase({ databasePath: "./json/rankUsers.json" });
const dbrp = new JsonDatabase({ databasePath: "./json/rankProdutos.json" });
const dbcp = new JsonDatabase({ databasePath: "./json/perfil.json" });

module.exports = {
    name: "perfil",
    description: "🤖 | Veja o seu perfil ou de outro usuário",
    type: Discord.ApplicationCommandType.ChatInput,
    options: [
        {
            name: "user",
            description: "Escolha algum usuário!",
            type: Discord.ApplicationCommandOptionType.User,
            required: false
        }
    ],
    run: async (client, interaction) => {
        // Defer para evitar timeout e garantir resposta ephemeral
        await interaction.deferReply({ ephemeral: true }).catch(err => {
            console.error(`[PERFIL] Erro ao deferir:`, err);
            return;
        });

        try {
            const usuario = interaction.options.getUser("user") || interaction.user;
            // Obtém o membro correspondente para exibir o nickname (displayName)
            const member = interaction.guild.members.cache.get(usuario.id);
            const displayName = member?.displayName || usuario.username;

            const id = usuario.id;

            // Função auxiliar para formatar valor monetário com segurança
            const formatarDinheiro = (rawValue) => {
                const num = Number(rawValue);
                if (isNaN(num) || num === 0) return "R$0,00";
                return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };

            const comprasRealizadas = dbcp.get(`${id}.comprasrealizadas`) || 0;
            const dinheiroGasto = formatarDinheiro(dbcp.get(`${id}.valoresganhos`));

            const embed = new EmbedBuilder()
                .setAuthor({ name: `Perfil de ${displayName}!`, iconURL: usuario.displayAvatarURL() })
                .addFields(
                    { name: `Compras:`, value: `${comprasRealizadas} compra(s) realizada(s).`, inline: true },
                    { name: `Dinheiro gasto:`, value: `${dinheiroGasto}`, inline: true }
                )
                .setColor(dbc.get(`color`) || 0x2b2d31)
                .setThumbnail(usuario.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(`[PERFIL] Erro na execução:`, error);
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: '❌ | Ocorreu um erro ao consultar o perfil.' });
                } else {
                    await interaction.followUp({ content: '❌ | Erro inesperado.', ephemeral: true });
                }
            } catch (replyErr) {
                console.error(`[PERFIL] Falha ao enviar mensagem de erro:`, replyErr);
            }
        }
    }
};