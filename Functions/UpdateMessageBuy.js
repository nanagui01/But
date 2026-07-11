const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, Attachment, AttachmentBuilder} = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json"})
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json"})
const dbp = new JsonDatabase({ databasePath: "./json/personalizados.json"})
const db = new JsonDatabase({ databasePath: "./json/produtos.json"})
const fs = require("fs")
const Discord = require("discord.js")

function montarOptionsEmbed(x, interaction) {
    const embed = new EmbedBuilder()
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp()

    let titulo = dbp.get(`painel_button.titulo`) || "";
    titulo = titulo.replace("{nome}", x.titulo)
    titulo = titulo.replace("{valor}", Number(x.produtos[0].preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    titulo = titulo.replace("{estoque}", x.produtos[0].estoque.length)

    let desc = dbp.get(`painel_button.msg`) || "";
    desc = desc.replace("{nome}", x.titulo)
    desc = desc.replace("{valor}", Number(x.produtos[0].preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    desc = desc.replace("{estoque}", x.produtos[0].estoque.length)
    desc = desc.replace("{desc}", x.desc)

    if (x.produtos.length > 1) {
        titulo = dbp.get(`painel_select.titulo`) || "";
        titulo = titulo.replace("{nome}", x.titulo)
        desc = dbp.get(`painel_select.msg`) || "";
        desc = desc.replace("{nome}", x.titulo)
        desc = desc.replace("{desc}", x.desc)
    }

    const dataa = x.button || {}
    embed.setTitle(titulo)
    embed.setDescription(desc)
    embed.setColor(dataa.color || dbc.get(`color`))

    const button = new ButtonBuilder()
        .setStyle(db.get(`${x.id}.button.style`) || dbp.get(`painel_button.button.style`))
        .setCustomId(`${x.id}_${x.produtos[0].nome}_produtopainel`)
        .setLabel(`${db.get(`${x.id}.button.text`) || dbp.get(`painel_button.button.text`)}`)

    if (db.get(`${x.id}.button.emoji`) || dbp.get(`painel_button.button.emoji`)) {
        button.setEmoji(db.get(`${x.id}.button.emoji`) || dbp.get(`painel_button.button.emoji`))
    }

    const actionrowselect = new StringSelectMenuBuilder()
        .setCustomId(x.id)
        .setPlaceholder(dbp.get(`painel_select.select.place`))

    for (const c of x.produtos) {
        let tituloOpt = dbp.get(`painel_select.select.text`) || "";
        tituloOpt = tituloOpt.replace("{nome}", c.nome)
        tituloOpt = tituloOpt.replace("{valor}", Number(c.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
        tituloOpt = tituloOpt.replace("{estoque}", c.estoque.length)
        let descOpt = dbp.get(`painel_select.select.desc`) || "";
        descOpt = descOpt.replace("{nome}", c.nome)
        descOpt = descOpt.replace("{desc}", c.desc)
        descOpt = descOpt.replace("{valor}", Number(c.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
        descOpt = descOpt.replace("{estoque}", c.estoque.length)
        const options = {
            label: `${tituloOpt}`,
            description: `${descOpt}`,
            value: `${c.nome}`
        }
        if (c.emoji) options.emoji = c.emoji
        actionrowselect.addOptions(options)
    }

    let row
    if (x.produtos.length === 1) {
        row = new ActionRowBuilder().addComponents(button)
    } else {
        row = new ActionRowBuilder().addComponents(actionrowselect)
    }

    const options = { embeds: [embed], components: [row], content: "", files: [] };

    if (x.banner) {
        if (fs.existsSync(`./Imagens/banners/${x.id}.png`)) {
            const filePathBanner = `./Imagens/banners/${x.id}.png`;
            const sanitizedIdBanner = x.id.replace(/[\s+]/g, "-").replace(/[^\w-]/g, "-");
            const banner = new AttachmentBuilder(filePathBanner, { name: `${sanitizedIdBanner}.png` });
            options.files.push(banner);
            embed.setImage(`attachment://${sanitizedIdBanner}.png`);
        }
    }

    if (x.thumb) {
        embed.setThumbnail(x.thumb)
    }

    return options
}

function montarOptionsTexto(x) {
    let desc = dbp.get(`painel_button.msg`) || "";
    desc = desc.replace("{nome}", x.titulo)
    desc = desc.replace("{valor}", Number(x.produtos[0].preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    desc = desc.replace("{estoque}", x.produtos[0].estoque.length)
    desc = desc.replace("{desc}", x.desc)

    if (x.produtos.length > 1) {
        desc = dbp.get(`painel_select.msg`) || "";
        desc = desc.replace("{nome}", x.titulo)
        desc = desc.replace("{desc}", x.desc)
    }

    const button = new ButtonBuilder()
        .setStyle(db.get(`${x.id}.button.style`) || dbp.get(`painel_button.button.style`))
        .setCustomId(`${x.id}_${x.produtos[0].nome}_produtopainel`)
        .setLabel(`${db.get(`${x.id}.button.text`) || dbp.get(`painel_button.button.text`)}`)

    if (db.get(`${x.id}.button.emoji`) || dbp.get(`painel_button.button.emoji`)) {
        button.setEmoji(db.get(`${x.id}.button.emoji`) || dbp.get(`painel_button.button.emoji`))
    }

    const actionrowselect = new StringSelectMenuBuilder()
        .setCustomId(x.id)
        .setPlaceholder(dbp.get(`painel_select.select.place`))

    for (const c of x.produtos) {
        let titulo = dbp.get(`painel_select.select.text`) || "";
        titulo = titulo.replace("{nome}", c.nome)
        titulo = titulo.replace("{valor}", Number(c.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
        titulo = titulo.replace("{estoque}", c.estoque.length)
        let desc2 = dbp.get(`painel_select.select.desc`) || "";
        desc2 = desc2.replace("{nome}", c.nome)
        desc2 = desc2.replace("{desc}", c.desc)
        desc2 = desc2.replace("{valor}", Number(c.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
        desc2 = desc2.replace("{estoque}", c.estoque.length)
        const options = {
            label: `${titulo}`,
            description: `${desc2}`,
            value: `${c.nome}`
        }
        if (c.emoji) options.emoji = c.emoji
        actionrowselect.addOptions(options)
    }

    let row
    if (x.produtos.length === 1) {
        row = new ActionRowBuilder().addComponents(button)
    } else {
        row = new ActionRowBuilder().addComponents(actionrowselect)
    }

    const options = { embeds: [], components: [row], content: desc, files: [] }

    if (x.banner) {
        if (fs.existsSync(`./Imagens/banners/${x.id}.png`)) {
            const filePathBanner = `./Imagens/banners/${x.id}.png`;
            const sanitizedIdBanner = x.id.replace(/[\s+]/g, "-").replace(/[^\w-]/g, "-");
            const banner = new AttachmentBuilder(filePathBanner, { name: `${sanitizedIdBanner}.png` });
            options.files.push(banner);
        }
    }

    return options
}

function produtoValido(x) {
    return !!(x && x.titulo && Array.isArray(x.produtos) && x.produtos.length > 0 && x.produtos[0])
}

async function sendMessage(interaction, painelId, channelId) {
    try {
        const x = db.get(`${painelId}`)

        if (!produtoValido(x)) {
            console.error(`[UpdateMessageBuy:sendMessage] Produto/painel "${painelId}" não encontrado ou com dados incompletos.`)
            return null
        }

        const channel = interaction.guild.channels.cache.get(channelId)
        if (!channel) {
            console.error(`[UpdateMessageBuy:sendMessage] Canal "${channelId}" não encontrado ou bot sem acesso.`)
            return null
        }

        const options = dbp.get(`modo`) === "embed" ? montarOptionsEmbed(x, interaction) : montarOptionsTexto(x)

        try {
            const msg = await channel.send(options)
            db.set(`${painelId}.idmsg`, `${msg.id}`)
            db.set(`${painelId}.idchannel`, `${channel.id}`)
            return msg
        } catch (sendError) {
            console.error(`[UpdateMessageBuy:sendMessage] Falha ao enviar mensagem do painel "${painelId}":`, sendError)
            return null
        }
    } catch (error) {
        console.error(`[UpdateMessageBuy:sendMessage] Erro inesperado:`, error)
        return null
    }
}

async function updateEspecifico(interaction, painelId) {
    try {
        let x = painelId
        if (!painelId?.titulo) {
            x = db.get(`${painelId}`);
        }

        if (!produtoValido(x)) {
            console.error(`[UpdateMessageBuy:updateEspecifico] Produto/painel inválido ou incompleto.`)
            return null
        }

        const channel = interaction.guild.channels.cache.get(x.idchannel);
        if (!channel) {
            console.error(`[UpdateMessageBuy:updateEspecifico] Canal "${x.idchannel}" não encontrado ou bot sem acesso.`)
            return null
        }

        let msg
        try {
            msg = await channel.messages.fetch(x.idmsg)
        } catch (fetchError) {
            console.error(`[UpdateMessageBuy:updateEspecifico] Falha ao buscar mensagem "${x.idmsg}" no canal "${x.idchannel}":`, fetchError)
            return null
        }

        const options = dbp.get(`modo`) === "embed" ? montarOptionsEmbed(x, interaction) : montarOptionsTexto(x)

        try {
            const editedMsg = await msg.edit(options)
            db.set(`${x.id}.idmsg`, `${editedMsg.id}`)
            db.set(`${x.id}.idchannel`, `${editedMsg.channel.id}`)
            return editedMsg
        } catch (editError) {
            console.error(`[UpdateMessageBuy:updateEspecifico] Falha ao editar mensagem do painel "${x.id}":`, editError)
            return null
        }
    } catch (error) {
        console.error(`[UpdateMessageBuy:updateEspecifico] Erro inesperado:`, error)
        return null
    }
}

module.exports = {
    updateEspecifico,
    sendMessage
}
