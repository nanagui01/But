const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ApplicationCommandType, ApplicationCommandOptionType, ComponentType } = require("discord.js");
const Discord = require("discord.js");
const { JsonDatabase } = require("wio.db");

const dbe  = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dc   = new JsonDatabase({ databasePath: "./json/carrinho.json" });
const dbc  = new JsonDatabase({ databasePath: "./json/botconfig.json" });
const dbp  = new JsonDatabase({ databasePath: "./json/perms.json" });
const db   = new JsonDatabase({ databasePath: "./json/produtos.json" });
const dbr  = new JsonDatabase({ databasePath: "./json/rendimentos.json" });
const dbru = new JsonDatabase({ databasePath: "./json/rankUsers.json" });
const dbrp = new JsonDatabase({ databasePath: "./json/rankProdutos.json" });
const dbcp = new JsonDatabase({ databasePath: "./json/perfil.json" });

module.exports = {
    name: "rank",
    description: "🤖 | Exiba o rank de clientes ou produtos",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "clientes",
            description: "🤖 | Exiba o rank de clientes com o valor gasto",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "produtos",
            description: "🤖 | Exiba o rank de produtos que mais venderam.",
            type: ApplicationCommandOptionType.Subcommand,
        }
    ],
    run: async (client, interaction) => {
        // Defer para evitar timeout
        await interaction.deferReply({ ephemeral: false }).catch(err => {
            console.error(`[RANK] Erro ao deferir:`, err);
            return;
        });

        try {
            const subcommand = interaction.options.getSubcommand();
            const isProdutos = subcommand === "produtos";

            // Permissão apenas para "produtos"
            if (isProdutos && !dbp.has(interaction.user.id)) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Você não tem permissão para usar este comando!`
                });
            }

            // Seleciona o banco e o campo de ordenação
            const dbRank = isProdutos ? dbrp : dbru;
            const campoValor = isProdutos ? "valoresganhos" : "gastosaprovados";
            const campoVendas = isProdutos ? "vendasfeitas" : "pedidosaprovados";
            const tituloRank = isProdutos ? "📦 Rank de produtos!" : "💸 Rank de clientes!";

            const dados = dbRank.all()
                .filter(i => i.data && i.data[campoValor] != null)
                .sort((a, b) => (b.data[campoValor] || 0) - (a.data[campoValor] || 0));

            if (dados.length < 1) {
                return await interaction.editReply({
                    content: isProdutos ? "Nenhum produto no rank." : "Ninguém está no rank."
                });
            }

            const pageSize = 10;
            let page = 0;

            const gerarPagina = () => {
                const inicio = page * pageSize;
                const items = dados.slice(inicio, inicio + pageSize);
                const numInicial = inicio + 1;

                const linhas = items.map((entry, index) => {
                    const posicao = numInicial + index;
                    const valor = Number(entry.data[campoValor] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const vendas = entry.data[campoVendas] || 0;
                    const textoVendas = vendas === 1 ? "vez" : "vezes";

                    if (isProdutos) {
                        return `-# **__${posicao}°__** - ${entry.ID} - **Valor acumulado:** R$${valor}. **Vendeu:** ${vendas} ${textoVendas}.`;
                    } else {
                        return `-# **\`${posicao}.\`** - <@${entry.ID}> - **Gastou:** R$${valor}. **Comprou:** ${vendas} ${textoVendas}.`;
                    }
                }).join('\n');

                const totalPaginas = Math.ceil(dados.length / pageSize);

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('primeiraPagina').setEmoji('⏮️').setDisabled(page === 0).setStyle(2),
                    new ButtonBuilder().setCustomId('voltar').setEmoji('⬅️').setDisabled(page === 0).setStyle(2),
                    new ButtonBuilder().setCustomId('proximo').setEmoji('➡️').setDisabled(page === totalPaginas - 1).setStyle(2),
                    new ButtonBuilder().setCustomId('ultimaPagina').setEmoji('⏭️').setDisabled(page === totalPaginas - 1).setStyle(2),
                );

                const embed = new EmbedBuilder()
                    .setAuthor({ name: tituloRank, iconURL: interaction.guild.iconURL() })
                    .setColor(dbc.get(`color`) || 0x2b2d31)
                    .setFooter({ text: `Página ${page + 1} de ${totalPaginas}` })
                    .setDescription(`\n${linhas}`);

                return { embed, components: [row] };
            };

            const { embed, components } = gerarPagina();
            const message = await interaction.editReply({ embeds: [embed], components });

            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 300_000 // 5 minutos
            });

            collector.on('collect', async (btnInteraction) => {
                // Apenas o autor do comando pode navegar
                if (btnInteraction.user.id !== interaction.user.id) {
                    return await btnInteraction.reply({
                        content: `${dbe.get('13') || '❌'} | Apenas quem usou o comando pode navegar.`,
                        ephemeral: true
                    }).catch(() => {});
                }

                try {
                    switch (btnInteraction.customId) {
                        case 'proximo': page += 1; break;
                        case 'voltar': page -= 1; break;
                        case 'ultimaPagina': page = Math.ceil(dados.length / pageSize) - 1; break;
                        case 'primeiraPagina': page = 0; break;
                    }

                    const { embed, components } = gerarPagina();
                    await btnInteraction.update({ embeds: [embed], components });
                } catch (err) {
                    console.error(`[RANK] Erro ao atualizar página:`, err);
                    await btnInteraction.reply({
                        content: '❌ | Erro ao navegar no rank.',
                        ephemeral: true
                    }).catch(() => {});
                }
            });

            collector.on('end', async () => {
                // Remove botões ao expirar (opcional)
                try {
                    await message.edit({ components: [] }).catch(() => {});
                } catch (e) {}
            });

        } catch (error) {
            console.error(`[RANK] Erro na execução:`, error);
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: '❌ | Ocorreu um erro ao carregar o rank.' });
                } else {
                    await interaction.followUp({ content: '❌ | Erro inesperado.', ephemeral: true });
                }
            } catch (replyErr) {
                console.error(`[RANK] Falha ao enviar mensagem de erro:`, replyErr);
            }
        }
    }
};