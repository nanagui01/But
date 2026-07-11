const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, AttachmentBuilder } = require("discord.js");
const Discord = require("discord.js");
const { JsonDatabase } = require("wio.db");
const fs = require("fs");
const { updateEspecifico } = require("../../Functions/UpdateMessageBuy");

const dbe = new JsonDatabase({ databasePath: "./json/emojis.json" });
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json" });
const dbp = new JsonDatabase({ databasePath: "./json/perms.json" });
const db = new JsonDatabase({ databasePath: "./json/produtos.json" });

module.exports = {
    name: "delivery",
    description: "📦🤖| Envie alguns produtos para alguém.",
    type: Discord.ApplicationCommandType.ChatInput,
    options: [
        {
            name: "produto",
            description: "Escolha um produto.",
            type: Discord.ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true,
        },
        {
            name: "quantidade",
            description: "Escreva a quantidade de produtos que será enviada.",
            type: Discord.ApplicationCommandOptionType.Number,
            required: true,
        },
        {
            name: "usuario",
            description: "Selecione o usuário que receberá o(s) produto(s).",
            type: Discord.ApplicationCommandOptionType.User,
            required: true,
        },
    ],

    async autocomplete(interaction) {
        try {
            const value = interaction.options.getFocused().toLowerCase();
            let pds = [];

            // wio.db all() é síncrono, mas mantemos compatível
            const entries = db.all(); // Retorna array de { ID, data }

            entries.forEach(entry => {
                const painelId = entry.ID; // ID do painel
                const data = entry.data;
                const produtos = data?.produtos;
                if (produtos && Array.isArray(produtos)) {
                    produtos.forEach(produto => {
                        pds.push({ ...produto, painelId });
                    });
                }
            });

            const filtered = pds
                .filter(produto => produto.nome && produto.nome.toLowerCase().includes(value))
                .slice(0, 25);

            if (pds.length === 0) {
                await interaction.respond([
                    { name: "Nenhum produto foi criado!", value: "sem_produtos" }
                ]);
            } else if (filtered.length === 0) {
                await interaction.respond([
                    { name: "Não achei nenhum produto com esse nome.", value: "nenhum_produto" }
                ]);
            } else {
                await interaction.respond(
                    filtered.map(choice => ({
                        name: `⚡ Painel: ${choice.painelId} | 🪪 ${choice.nome} | 📦 ${choice.estoque?.length || 0}`,
                        value: `${choice.painelId}_${choice.nome}`
                    }))
                );
            }
        } catch (error) {
            console.error('[DELIVERY] Erro no autocomplete:', error);
            await interaction.respond([{ name: "Erro ao carregar produtos!", value: "erro_produtos" }]);
        }
    },

    run: async (client, interaction) => {
        // Defer para ganhar tempo (máximo 15 minutos para operações longas)
        await interaction.deferReply({ ephemeral: true }).catch(err => {
            console.error(`[DELIVERY] Erro ao deferir:`, err);
            return;
        });

        try {
            // Permissão corrigida
            if (!dbp.has(interaction.user.id)) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Você não tem permissão para usar este comando!`
                });
            }

            const produtoString = interaction.options.getString("produto");
            const [painelId, nome] = produtoString.split("_");
            const qtd = interaction.options.getNumber("quantidade");
            const user = interaction.options.getUser("usuario");

            if (!interaction.guild.members.cache.get(user.id)) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Usuário não encontrado!`
                });
            }

            // Busca o array de produtos do painel
            const produtoss = db.get(`${painelId}.produtos`) || [];
            const pdIndex = produtoss.findIndex(a => a.nome === nome);

            if (pdIndex === -1 || !produtoss[pdIndex]) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Produto não encontrado!`
                });
            }

            const pd = produtoss[pdIndex];
            const estoque = pd.estoque || [];

            if (estoque.length < 1) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Este produto não tem estoque!`
                });
            }

            if (estoque.length < qtd) {
                const emojiErro = dbe.get(`13`) || '❌';
                return await interaction.editReply({
                    content: `${emojiErro} | Estoque insuficiente! Disponível: ${estoque.length}`
                });
            }

            // Extrai os produtos do estoque (remove as primeiras 'qtd' ocorrências)
            const produtosEntregues = estoque.splice(0, qtd);
            // Atualiza o painel com o estoque restante (splice já modifica o array original)
            db.set(`${painelId}.produtos`, produtoss);

            // Verifica se faltou estoque (agora já tratamos antes, mas por segurança)
            let faltou = false;
            let quantosFaltaram = qtd - produtosEntregues.length;

            // Gera conteúdo da entrega
            let filed = null;
            let isFile = false;
            const totalChars = produtosEntregues.join('\n').length;

            if (produtosEntregues.length <= 5 && totalChars < 1500) {
                filed = produtosEntregues.map(p => `${p}`).join('\n');
            } else {
                isFile = true;
                filed = `./entrega-${user.id}.txt`;
                fs.writeFileSync(filed, produtosEntregues.join('\n'));
            }

            // Cria embeds
            const emojiSucesso = dbe.get(`6`) || '✅';
            const embedVenda = new EmbedBuilder()
                .setAuthor({ name: `✅ Entrega Feita!`, iconURL: user.displayAvatarURL() })
                .setColor(dbc.get(`color`) || 0x00ff00)
                .addFields(
                    { name: `Enviado por:`, value: `${interaction.user} (\`${interaction.user.username} - ${interaction.user.id}\`)`, inline: true },
                    { name: `Produto:`, value: `${pd.nome} \`x${qtd}\``, inline: true },
                    { name: `Data / Horário:`, value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true }
                )
                .setThumbnail(interaction.guild.iconURL());

            const embedVendaStaff = new EmbedBuilder()
                .setAuthor({ name: `✅ Solicitação de Entrega Concluída!`, iconURL: user.displayAvatarURL() })
                .setColor("Green")
                .addFields(
                    { name: `Autor:`, value: `${interaction.user} (\`${interaction.user.username} - ${interaction.user.id}\`)`, inline: true },
                    { name: `Recebedor:`, value: `${user} (\`${user.username} - ${user.id}\`)`, inline: true },
                    { name: `Produto:`, value: `${pd.nome} \`x${qtd}\``, inline: true },
                    { name: `Data:`, value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true }
                )
                .setThumbnail(interaction.guild.iconURL());

            const embedProdutos = new EmbedBuilder()
                .setColor("Green")
                .setAuthor({ name: `📦 Produtos Recebidos:`, iconURL: user.displayAvatarURL() })
                .setTimestamp()
                .setDescription(isFile ? `**Todos os produtos estão em um arquivo abaixo.**` : `\`\`\`${filed}\`\`\``)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

            // Envia DM para o usuário
            try {
                await user.send({ embeds: [embedVenda, embedProdutos] });
                if (isFile) {
                    await user.send({ files: [filed] });
                }
            } catch (err) {
                console.error(`[DELIVERY] Erro ao enviar DM para ${user.tag}:`, err);
                // Tenta continuar mesmo se falhar a DM
            }

            // Envia para canal de logs privado, se configurado
            const logspriv = interaction.guild.channels.cache.get(dbc.get(`canais.vendas_privado`));
            if (logspriv) {
                try {
                    await logspriv.send({ embeds: [embedVendaStaff, embedProdutos] });
                    if (isFile) {
                        await logspriv.send({ files: [filed] });
                    }
                } catch (err) {
                    console.error(`[DELIVERY] Erro ao enviar log:`, err);
                }
            }

            // Remove arquivo temporário
            if (isFile && filed) {
                fs.unlink(filed, (err) => {
                    if (err) console.error(`[DELIVERY] Erro ao deletar arquivo temporário:`, err);
                });
            }

            // Responde ao comando
            const emojiFinal = dbe.get(`6`) || '✅';
            await interaction.editReply({
                content: `${emojiFinal} | Delivery entregue com sucesso!`
            });

            // Atualiza mensagem de venda (função externa)
            try {
                await updateEspecifico(interaction, painelId);
            } catch (err) {
                console.error(`[DELIVERY] Erro ao atualizar mensagem:`, err);
            }

        } catch (error) {
            console.error(`[DELIVERY] Erro na execução:`, error);
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content: `❌ | Ocorreu um erro interno durante a entrega. Contate o suporte.`
                    });
                } else {
                    await interaction.followUp({
                        content: `❌ | Erro inesperado.`,
                        ephemeral: true
                    });
                }
            } catch (replyErr) {
                console.error(`[DELIVERY] Falha ao enviar mensagem de erro:`, replyErr);
            }
        }
    }
};