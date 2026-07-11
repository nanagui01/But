const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, Attachment, AttachmentBuilder} = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json"})
const dc = new JsonDatabase({ databasePath: "./json/carrinho.json"})
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json"})
const dbcg = new JsonDatabase({ databasePath: "./json/configGlob.json"})
const dbp = new JsonDatabase({ databasePath: "./json/personalizados.json"})
const dbs = new JsonDatabase({ databasePath: "./json/saldo.json"})
const db = new JsonDatabase({ databasePath: "./json/produtos.json"})
const dbr = new JsonDatabase({ databasePath: "./json/rendimentos.json"})
const dbru = new JsonDatabase({ databasePath: "./json/rankUsers.json"})
const dbrp = new JsonDatabase({ databasePath: "./json/rankProdutos.json"})
const dbcp = new JsonDatabase({ databasePath: "./json/perfil.json"})
const fs = require("fs")
const path = require("path")
const https = require("https");
const axios = require("axios");
const Discord = require("discord.js")
const moment = require("moment")
moment.locale("pt-br");
const dbep = new JsonDatabase({ databasePath: "./json/emojisGlob.json"})
const { updateEspecifico, sendMessage } = require("./UpdateMessageBuy")
const { bloquearBanco, enviarProduto, deleteMessages } = require("./CarrinhoAprovado")

/////// MERCADO PAGO //////

async function formatValor(valor) {
    return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Helper: editReply seguro, nunca lança erro para cima
async function safeEditReply(interaction, payload) {
    try {
        if (!interaction.deferred && !interaction.replied) {
            console.error("[GerenciarChekout] Tentativa de editReply sem defer/reply prévio na interação.")
            return null
        }
        return await interaction.editReply(payload)
    } catch (error) {
        console.error("[GerenciarChekout] Erro ao editar resposta da interação:", error)
        return null
    }
}

// Helper: followUp seguro
async function safeFollowUp(interaction, payload) {
    try {
        return await interaction.followUp(payload)
    } catch (error) {
        console.error("[GerenciarChekout] Erro ao enviar followUp da interação:", error)
        return null
    }
}

// Helper: msg.edit seguro
async function safeMsgEdit(msg, payload) {
    try {
        if (!msg) return null
        return await msg.edit(payload)
    } catch (error) {
        console.error("[GerenciarChekout] Erro ao editar mensagem:", error)
        return null
    }
}

async function paymentMP(interaction, msg, produto, valor) {
    const { MercadoPagoConfig, Payment, PaymentRefund } = require("mercadopago");
    try {
        const access_token = await dbc.get(`pagamentos.acess_token`);
        const client = new MercadoPagoConfig({ accessToken: `${access_token}` });
        const payment = new Payment(client);
        const carrinho = dc.get(`${interaction.channel.id}`)

        const payment_data = {
            transaction_amount: Number(valor),
            description: `Cobrança produto: ${produto.nome} (${interaction.user.username})`,
            payment_method_id: 'pix',
            payer: {
                email: 'zendapplications@gmail.com'
            },
        }

        await safeMsgEdit(msg, { content: `${dbe.get("16")} | Gerando pagamento...` });

        const data = await payment.create({ body: payment_data });

        if (!data?.id) {
            console.error("[GerenciarChekout:paymentMP] Resposta do Mercado Pago sem id de pagamento válido.")
            await safeMsgEdit(msg, { content: `${dbe.get("13")} | Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.` });
            return "error";
        }

        const embed = new EmbedBuilder()
            .setAuthor({ name: `🛒 Carrinho criado!`, iconURL: interaction.user.displayAvatarURL({}) })
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋\n- Você abriu um carrinho!`)
            .addFields(
                { name: `Detalhes do carrinho:`, value: `\`${dc.get(`${interaction.channel.id}.quantidade`)}x\` __${produto.nome}__ | R$${await formatValor(valor)}` }
            )
            .setThumbnail(interaction.user.displayAvatarURL({}))
            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({}) })
            .setTimestamp();

        const cliente = interaction.guild.members.cache.get(dc.get(`${interaction.channel.id}.user`));
        if (cliente) await cliente.send({ embeds: [embed] }).catch(() => {})

        return {
            data: data,
            acess_token: access_token
        };
    } catch (err) {
        console.error("[GerenciarChekout:paymentMP] Erro ao processar o pagamento:", err);
        await safeMsgEdit(msg, { content: `${dbe.get("13")} | Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.` });
        return "error";
    }
}

async function paymentMPError(interaction, msg, produto, valor) {
    try {
        let emjpix = dbep.get(`39`)
        let emjpay = dbep.get(`40`)
        let emjvol = dbep.get(`29`)
        const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setStyle(2)
            .setCustomId(`${interaction.channel.id}_pagarpix`)
            .setLabel(`Pix`)
            .setEmoji(emjpix),
            new ButtonBuilder()
            .setStyle(2)
            .setCustomId(`${interaction.channel.id}_paypal`)
            .setLabel(`PayPal`)
            .setDisabled(true)
            .setEmoji(emjpay),
            new ButtonBuilder()
            .setStyle(1)
            .setCustomId(`${interaction.channel.id}_carrinhovoltar`)
            .setLabel(`Voltar`)
            .setEmoji(emjvol)
        )
        await safeMsgEdit(msg, { embeds: [], content: `Escolha qual a forma de pagamento.`, components: [row]})
        await safeFollowUp(interaction, { content: `${dbe.get("13")} | Ocorreu um erro ao tentar gerar pagamento. Tente novamente.`, ephemeral:true})
    } catch (error) {
        console.error("[GerenciarChekout:paymentMPError] Erro ao notificar falha de pagamento:", error)
    }
}

async function gerarCobrancaEfi(interaction, msg, produto, valor, prefixoConfig) {
    // prefixoConfig: "pagamentos" ou "esales" — mantém o comportamento original de cada função
    const carrinho = dc.get(`${interaction.channel.id}`)

    const certificadoNome = dbc.get(`${prefixoConfig}.certificado`) ? dbc.get(`${prefixoConfig}.certificado`) : "undefinied"
    let certificado
    try {
        certificado = fs.readFileSync(`./Lib/${certificadoNome}.p12`);
    } catch (fsError) {
        console.error(`[GerenciarChekout:gerarCobrancaEfi] Falha ao ler certificado "${certificadoNome}.p12":`, fsError)
        throw fsError
    }

    const httpsAgent = new https.Agent({
        pfx: certificado,
        passphrase: "",
    });

    const dataToken = JSON.stringify({ grant_type: "client_credentials" });
    const data_credentials = dbc.get(`${prefixoConfig}.secret_id`) + ":" + dbc.get(`${prefixoConfig}.secret_token`);
    const auth = Buffer.from(data_credentials).toString("base64");

    const tokenConfig = {
        method: "POST",
        url: "https://pix.api.efipay.com.br/oauth/token",
        headers: {
            Authorization: "Basic " + auth,
            "Content-Type": "application/json",
        },
        httpsAgent: httpsAgent,
        data: dataToken,
    };

    const embed = new EmbedBuilder()
        .setAuthor({ name: `🛒 Carrinho criado!`, iconURL: interaction.user.displayAvatarURL({}) })
        .setColor(dbc.get("color"))
        .setDescription(`Olá ${interaction.user} 👋\n- Você abriu um carrinho!`)
        .addFields(
            { name: `Detalhes do carrinho:`, value: `\`${carrinho.quantidade}x ${produto.nome} | R$${await formatValor(valor)} \`` }
        )
        .setThumbnail(interaction.user.displayAvatarURL({}))
        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({}) })
        .setTimestamp();

    const cliente = interaction.guild.members.cache.get(dc.get(`${interaction.channel.id}.user`));
    if (cliente) await cliente.send({ embeds: [embed] }).catch(() => {})

    let access_token;
    try {
        const tokenResponse = await axios(tokenConfig);
        access_token = tokenResponse?.data?.access_token;
    } catch (tokenError) {
        console.error(`[GerenciarChekout:gerarCobrancaEfi] Erro ao obter access_token (${prefixoConfig}):`, tokenError?.response?.data ?? tokenError.message);
    }

    if (!access_token) {
        // Falha real: não segue adiante fingindo sucesso
        throw new Error(`Não foi possível obter access_token da EfiPay (${prefixoConfig}).`)
    }

    await safeEditReply(interaction, { content: ` Espere só mais um pouco...`, components: [], embeds: [] })

    const dataCobranca = JSON.stringify({
        "calendario": {
            "expiracao": 10 * 60
        },
        "devedor": {
            "cpf": "65583988002",
            "nome": `${interaction.user.username}`,
        },
        "valor": {
            "original": `${valor}`,
        },
        "chave": `${dbc.get(`${prefixoConfig}.chavepix`)}`,
        "solicitacaoPagador": "Cobrança dos serviços prestados."
    });

    const cobrancaConfig = {
        method: "post",
        url: "https://pix.api.efipay.com.br/v2/cob",
        headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json"
        },
        httpsAgent: httpsAgent,
        data: dataCobranca,
    };

    let responseData;
    try {
        const cobrancaResponse = await axios(cobrancaConfig);
        responseData = cobrancaResponse.data;
    } catch (cobrancaError) {
        console.error(`[GerenciarChekout:gerarCobrancaEfi] Erro ao gerar cobrança Pix (${prefixoConfig}):`, cobrancaError?.response?.data ?? cobrancaError.message);
    }

    if (!responseData) {
        throw new Error(`Não foi possível gerar a cobrança Pix na EfiPay (${prefixoConfig}).`)
    }

    return {
        data: responseData,
        acess_token: access_token
    };
}

async function paymentEfiPay(interaction, msg, produto, valor) {
    try {
        return await gerarCobrancaEfi(interaction, msg, produto, valor, "pagamentos")
    } catch (error) {
        console.error("[GerenciarChekout:paymentEfiPay] Erro:", error)
        await paymentMPError(interaction, msg, produto, valor)
        return "error";
    }
}

async function paymentEfiPaySales(interaction, msg, produto, valor) {
    try {
        return await gerarCobrancaEfi(interaction, msg, produto, valor, "esales")
    } catch (error) {
        console.error("[GerenciarChekout:paymentEfiPaySales] Erro:", error)
        await paymentMPError(interaction, msg, produto, valor)
        return "error";
    }
}

module.exports = {
    paymentMP,
    paymentMPError,
    paymentEfiPay,
    paymentEfiPaySales
}
