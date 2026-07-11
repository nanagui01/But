const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, Attachment, AttachmentBuilder} = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json"})
const dc = new JsonDatabase({ databasePath: "./json/carrinho.json"})
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json"})
const dbp = new JsonDatabase({ databasePath: "./json/personalizados.json"})
const db = new JsonDatabase({ databasePath: "./json/produtos.json"})
const Discord = require("discord.js")
const dbep = new JsonDatabase({ databasePath: "./json/emojisGlob.json"})
const { updateEspecifico, sendMessage } = require("../../Functions/UpdateMessageBuy")

// ---------- Helpers de segurança ----------

async function safeReply(interaction, payload) {
    try {
        if (interaction.replied || interaction.deferred) {
            console.error(`[abrir-carrinho] Tentativa de reply em interação já reconhecida (customId: ${interaction.customId}).`)
            return null
        }
        return await interaction.reply(payload)
    } catch (error) {
        console.error(`[abrir-carrinho] Erro ao responder interação (customId: ${interaction.customId}):`, error)
        return null
    }
}

async function safeEditReply(interaction, payload) {
    try {
        if (!interaction.replied && !interaction.deferred) {
            console.error(`[abrir-carrinho] Tentativa de editReply sem reply/defer prévio (customId: ${interaction.customId}).`)
            return null
        }
        return await interaction.editReply(payload)
    } catch (error) {
        console.error(`[abrir-carrinho] Erro ao editar resposta (customId: ${interaction.customId}):`, error)
        return null
    }
}

async function safeMsgEdit(msg, payload) {
    try {
        if (!msg) return null
        return await msg.edit(payload)
    } catch (error) {
        console.error("[abrir-carrinho] Erro ao editar mensagem de status do carrinho:", error)
        return null
    }
}

async function getMemberSafe(interaction, userId) {
    try {
        let member = interaction.guild.members.cache.get(userId)
        if (!member) {
            member = await interaction.guild.members.fetch(userId).catch(() => null)
        }
        return member
    } catch (error) {
        console.error("[abrir-carrinho] Erro ao buscar membro do servidor:", error)
        return null
    }
}

// ---------- Fluxo compartilhado de abertura de carrinho ----------

async function abrirCarrinhoParaProduto(interaction, x, produto, customIdOrigem) {
    const paumito = interaction.guild.channels.cache.get(dbc.get(`canais.vendas_privado`))
    const de = interaction.guild.roles.cache.get(dbc.get(`canais.cargo_staff`))
    const frango = interaction.guild.roles.cache.get(dbc.get(`canais.cargo_cliente`))
    const userId = interaction.user.id
    const user = await getMemberSafe(interaction, userId)

    if (!user) {
        await safeReply(interaction, { content: `${dbe.get(`13`)} | Não foi possível carregar seus dados de membro no servidor. Tente novamente.`, ephemeral: true })
        return
    }

    const rolevery = produto?.condições?.cargo ? user.roles.cache.has(produto.condições.cargo) : true
    const cargos = produto?.cargosLiberados || []

    if (cargos.length > 0) {
        const hasRole = cargos.some(a => user.roles.cache.has(a));
        if (hasRole) {
            await safeReply(interaction, { content: `${dbe.get(`13`)} | Você não pode comprar este produto porque tem um cargo proibido!`, ephemeral: true });
            return;
        }
    }

    if (produto?.condições?.cargo && !rolevery) {
        await safeReply(interaction, { content: `${dbe.get(`13`)} | Você não tem o cargo necessário para comprar este produto!`, ephemeral: true })
        return
    }
    if (!paumito) {
        await safeReply(interaction, { content: `${dbe.get(`13`)} | Canal logs privadas inválido!`, ephemeral: true })
        return;
    }
    if (!de) {
        await safeReply(interaction, { content: `${dbe.get(`13`)} | Cargo staff inválido!`, ephemeral: true })
        return;
    }
    if (!frango) {
        await safeReply(interaction, { content: `${dbe.get(`13`)} | Cargo cliente inválido!`, ephemeral: true })
        return;
    }

    if (dbc.get(`pagamentos.sistema`) === "OFF") {
        await safeReply(interaction, { content: `${dbe.get(`13`)} | Sistema de vendas desligado!`, ephemeral: true })
        return;
    }

    updateEspecifico(interaction, x).catch(err => console.error("[abrir-carrinho] Erro em updateEspecifico:", err))

    if (!produto) {
        await safeReply(interaction, { content: `${dbe.get(`13`)} | Produto não encontrado! Fale com o suporte do servidor.`, ephemeral: true })
        return
    }

    if (produto.estoque.length <= 0) {
        const embed = new Discord.EmbedBuilder()
            .setAuthor({ name: "Produto sem Estoque!", iconURL: interaction.user.displayAvatarURL({}) })
            .setDescription(`- Este produto está sem estoque no momento, aguarde um reabastecimento!`)
            .setColor(dbc.get(`color`) || "Default")
            .setTimestamp()
            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({}) })

        const row = new ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId(`${x.id}_${produto.nome}_ativarnotify`)
                    .setEmoji(dbe.get(`31`))
                    .setLabel('Ativar Notificação de Estoque')
                    .setStyle(2)
                    .setDisabled(false)
            )
        await safeReply(interaction, { embeds: [embed], components: [row], ephemeral: true })
        return;
    }

    const msg = await safeReply(interaction, { content: `${dbe.get(`16`)} | Aguarde, estamos criando o carrinho.`, ephemeral: true })
    if (!msg) return // reply falhou ou interação já estava acknowledged; nada mais a fazer com segurança

    const th = interaction.channel.threads.cache.find(t => t.name === `🛒・${interaction.user.username}`);
    if (th) {
        const row4 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setURL(`https://discord.com/channels/${interaction.guild.id}/${th.id}`)
                    .setLabel('Ir para o carrinho')
                    .setStyle(5)
            )
        await safeEditReply(interaction, { content: `${dbe.get(`13`)} | Você já possui um carrinho aberto.`, components: [row4] })
        return
    }

    let thread
    try {
        thread = await interaction.channel.threads.create({
            name: `🛒・${interaction.user.username}`,
            autoArchiveDuration: 60 * 24 * 7,
            type: Discord.ChannelType.PrivateThread,
            reason: 'Carrinho',
            members: [interaction.user.id],
        })
    } catch (err) {
        console.error("[abrir-carrinho] Erro ao criar thread do carrinho:", err)
        await safeMsgEdit(msg, { content: `${dbe.get(`13`)} | Ocorreu um erro ao criar o carrinho! Tente novamente.` })
        return
    }

    const embed = new EmbedBuilder()
        .setAuthor({ name: `🛒 Carrinho de ${interaction.user.displayName}.`, iconURL: interaction.user.displayAvatarURL({}) })
        .setColor(dbc.get(`color`))
        .setTimestamp()
        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({}) })
        .setDescription(`Olá ${interaction.user} 👋.\n- Gerencie a sua compra do produto **${produto.nome}** como desejar.`)
        .addFields(
            { name: `Detalhes do Carrinho:`, value: `\`1x\` __${produto.nome}__ | R$${Number(produto.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { name: `Valor Unidade:`, value: `R$${Number(produto.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, inline: true },
            { name: `Estoque:`, value: `${produto.estoque.length}`, inline: true },
        )
        .setThumbnail(interaction.guild.iconURL({}))

    const emjdin = dbep.get(`9`)
    const emjlap = dbep.get(`1`)
    const emjeti = dbep.get(`14`)
    const emjcan = dbep.get(`37`)

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setStyle(3).setCustomId(`${thread.id}_continuar`).setLabel(`Continuar`).setEmoji(emjdin),
            new ButtonBuilder().setStyle(2).setCustomId(`${thread.id}_editarqtd`).setLabel(`Editar Quantidade`).setEmoji(emjlap),
            new ButtonBuilder().setStyle(1).setCustomId(`${thread.id}_addcumpom`).setLabel(`Usar Cupom`).setEmoji(emjeti),
            new ButtonBuilder().setStyle(4).setCustomId(`${thread.id}_cancelarcarrinho`).setLabel(`Fechar`).setEmoji(emjcan)
        )

    let msgg
    try {
        msgg = await thread.send({ embeds: [embed], components: [row], content: `${interaction.user} | ${de}` })
    } catch (err) {
        console.error("[abrir-carrinho] Erro ao enviar mensagem inicial no thread do carrinho:", err)
        await safeMsgEdit(msg, { content: `${dbe.get(`13`)} | Ocorreu um erro ao criar o carrinho! Tente novamente.` })
        await thread.delete().catch(delErr => console.error("[abrir-carrinho] Erro ao apagar thread após falha:", delErr))
        return
    }

    const row4 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setURL(msgg.url).setLabel('Ir para o carrinho.').setStyle(5)
        )

    try {
        dc.set(`${thread.id}`, {
            id: thread.id,
            valor: produto.preco,
            quantidade: 1,
            cupom: "nenhum",
            desconto: 0,
            painel: x.id,
            user: interaction.user.id,
            produto: produto.nome,
            status: "esperando"
        })
    } catch (dbError) {
        console.error("[abrir-carrinho] Erro ao gravar carrinho no banco de dados:", dbError)
    }

    await safeMsgEdit(msg, { content: `${dbe.get(`6`)} | Carrinho criado com sucesso!`, components: [row4] })

    if (dbc.get(`pagamentos.sistema_auto`) === "ON") {
        setTimeout(() => {
            try {
                if (dc.get(`${thread.id}.status`) === "esperando") {
                    thread.delete().catch(delErr => console.error("[abrir-carrinho] Erro ao apagar thread por inatividade:", delErr))

                    if (dbc.get(`canais.sistema_carrinho`) === "ON") {
                        const embeda = new EmbedBuilder()
                            .setAuthor({ name: `🛒 Carrinho fechado!`, iconURL: interaction.user.displayAvatarURL({}) })
                            .setColor("Red")
                            .setDescription(`Olá ${interaction.user} 👋.\n- Seu carrinho foi fechado por inatividade!`)
                            .setThumbnail(interaction.user.displayAvatarURL({}))
                            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({}) })
                            .setTimestamp()

                        interaction.user.send({ embeds: [embeda] }).catch(() => {})

                        const embed2 = new EmbedBuilder()
                            .setAuthor({ name: `🛒 Carrinho fechado!`, iconURL: interaction.guild.iconURL({}) })
                            .setColor("Red")
                            .setDescription(`- O usuário ${interaction.user} (${interaction.user.username}) teve o seu carrinho fechado por inatividade.`)
                            .setThumbnail(interaction.user.displayAvatarURL({}))
                            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({}) })
                            .setTimestamp()

                        if (paumito) paumito.send({ embeds: [embed2] }).catch(err => console.error("[abrir-carrinho] Erro ao enviar log de fechamento automático:", err))
                    }
                }
            } catch (timeoutError) {
                console.error("[abrir-carrinho] Erro no timer de fechamento automático do carrinho:", timeoutError)
            }
        }, 1000 * 60 * 20)
    }
}

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        try {
            async function formatValor(valor) {
                return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            }

            if (interaction.isStringSelectMenu()) {
                const customId = interaction.customId;
                if (db.has(customId)) {
                    try {
                        const value = interaction.values[0]
                        const pd = db.get(`${customId}`)
                        const produto = pd?.produtos?.find(a => a.nome === value)
                        const x = pd
                        await abrirCarrinhoParaProduto(interaction, x, produto, customId)
                    } catch (error) {
                        console.error(`[abrir-carrinho] Erro no fluxo de StringSelectMenu (customId: ${customId}):`, error)
                        await safeReply(interaction, { content: `${dbe.get(`13`)} | Ocorreu um erro inesperado. Tente novamente.`, ephemeral: true })
                    }
                    return
                }
            }

            if (interaction.isButton()) {
                const customId = interaction.customId;
                const pd = customId.split("_")[0]
                const nome = customId.split("_")[1]

                if (customId.endsWith(`_produtopainel`)) {
                    try {
                        const painelData = db.get(`${pd}`)
                        if (db.has(`${pd}`) && painelData?.produtos?.[0]?.nome === nome) {
                            const produto = painelData.produtos.find(a => a.nome === nome)
                            await abrirCarrinhoParaProduto(interaction, painelData, produto, customId)
                        }
                    } catch (error) {
                        console.error(`[abrir-carrinho] Erro no fluxo de botão _produtopainel (customId: ${customId}):`, error)
                        await safeReply(interaction, { content: `${dbe.get(`13`)} | Ocorreu um erro inesperado. Tente novamente.`, ephemeral: true })
                    }
                    return
                }

                if (customId.endsWith("_ativarnotify")) {
                    try {
                        const userId = interaction.user.id;
                        const user = interaction.user;
                        const pdd = db.get(`${pd}`)

                        if (!pdd || !Array.isArray(pdd.produtos)) {
                            await safeReply(interaction, { content: `${dbe.get(`13`)} | Produto/painel não encontrado.`, ephemeral: true })
                            return
                        }

                        const pdddIndex = pdd.produtos.findIndex(id => id.nome === nome)
                        if (pdddIndex === -1) {
                            await safeReply(interaction, { content: `${dbe.get(`13`)} | Produto não encontrado neste painel.`, ephemeral: true })
                            return
                        }

                        const notusers = pdd.produtos[pdddIndex].notificados || []
                        const findUser = notusers.find(a => a === userId)

                        if (findUser) {
                            await safeReply(interaction, { content: `${dbe.get(`2`)} | Você ja está na lista de notificação deste produto!`, ephemeral: true })
                            return
                        }

                        notusers.push(userId)
                        pdd.produtos[pdddIndex].notificados = notusers
                        await db.set(`${pd}`, pdd)

                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Pedido de estoque!`, iconURL: interaction.guild.iconURL({}) })
                            .setColor("Gold")
                            .setDescription(`- O usuário ${user} (${user.username}) fez um pedido de estoque!`)
                            .setFields(
                                { name: `Painel:`, value: `${pd}`, inline: true },
                                { name: `Produto:`, value: `${nome}`, inline: false },
                                { name: `Data / Horário:`, value: `<t:${Math.floor(new Date() / 1000)}:f> (<t:${~~(new Date() / 1000)}:R>)` }
                            )
                            .setThumbnail(interaction.user.displayAvatarURL({}))
                            .setTimestamp()
                            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({}) })

                        const channel = interaction.guild.channels.cache.get(dbc.get(`canais.vendas_privado`))
                        if (channel) {
                            await channel.send({ embeds: [embed] }).catch(err => console.error("[abrir-carrinho] Erro ao enviar log de pedido de estoque:", err))
                        }

                        await safeReply(interaction, { content: `${dbe.get(`6`)} | Você foi adicionado à lista de notificação deste produto com sucesso!`, ephemeral: true })
                    } catch (error) {
                        console.error(`[abrir-carrinho] Erro no fluxo de _ativarnotify (customId: ${customId}):`, error)
                        await safeReply(interaction, { content: `${dbe.get(`13`)} | Ocorreu um erro inesperado. Tente novamente.`, ephemeral: true })
                    }
                }
            }
        } catch (error) {
            console.error("[abrir-carrinho] Erro inesperado não capturado no handler interactionCreate:", error)
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: "❌ | Ocorreu um erro inesperado ao processar sua solicitação.", ephemeral: true }).catch(() => {})
                }
            } catch (_) {}
        }
    }
}
