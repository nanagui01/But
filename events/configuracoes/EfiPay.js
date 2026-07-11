const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, TextInputStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, Attachment, AttachmentBuilder} = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json"})
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json"})
const dbep = new JsonDatabase({ databasePath: "./json/emojisGlob.json"})

const fs = require("fs")
const path = require("path")
const https = require("https");
const axios = require("axios");
const Discord = require("discord.js")
const moment = require("moment")
moment.locale("pt-br");


const EfiPay = require('sdk-node-apis-efi')
const options = require("../../schema/credenciais.js")

const { updateEspecifico, sendMessage } = require("../../Functions/UpdateMessageBuy")
const { bloquearBanco, enviarProduto, deleteMessages } = require("../../Functions/CarrinhoAprovado")
const { paymentEfiPay } = require("../../Functions/GerenciarChekout.js")

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        async function formatValor(valor) {
            return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }

        if (interaction.customId === "config_pagamentos_efi_sistema") {
                if (dbc.get(`pagamentos.sistema_efi`) === "ON") {
                    dbc.set(`pagamentos.sistema_efi`, "OFF") 
                    dbc.set(`pagamentos.sistema_auto`, "ON") 
                    dbc.set(`pagamentos.sistema_semiauto`, "OFF") 
                } else {
                    dbc.set(`pagamentos.sistema_efi`, "ON") 
                    dbc.set(`pagamentos.sistema_semiauto`, "OFF") 
                    dbc.set(`pagamentos.sistema_auto`, "OFF") 
                }
                EfiBank(interaction)
        }
        
        if (interaction.customId === `config_pagamentos_secretconfig`) {
            const modal = new ModalBuilder()
                .setCustomId(`alterarcredenciais`)
                .setTitle(`Credenciais Efi Bank`)

            const clientid = new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("clientid")
                    .setLabel("CLIENT ID")
                    .setPlaceholder("Client_id_XxxXxXx")
                    .setValue(`${dbc.get(`pagamentos.secret_id`) || ""}`)
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short)
            )

            const clientsecret = new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("clientsecret")
                    .setLabel("CLIENT SECRET")
                    .setPlaceholder("Client_secret_XxxXxXx")
                    .setValue(`${dbc.get(`pagamentos.secret_token`) || ""}`)
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short)
            )

            modal.addComponents(clientid, clientsecret)
            await interaction.showModal(modal)
        }
        
        if (interaction.customId === `config_pagamentos_efiblock`) {
            efiblock(interaction, client)
        }

        if (interaction.customId === `alterarcredenciais`) {
            const clientid = interaction.fields.getTextInputValue("clientid");
            const clientsecret = interaction.fields.getTextInputValue("clientsecret");
        
            await interaction.reply({
                content: `\`${dbe.get("6")}\` 50% do processo já concluído, agora envie o certificado .p12.`,
                ephemeral: true
            });
        
            const filter = (msg) => {
                if (msg.author.id !== interaction.user.id) return false;
                if (!msg.attachments.size) return false;
                const file = msg.attachments.first();
                return file.name.toLowerCase().endsWith('.p12');
            };
        
            try {
                const collected = await interaction.channel.awaitMessages({
                    filter,
                    max: 1,
                    time: 60000,
                    errors: ['time']
                });
        
                const msg = collected.first();
                const file = msg.attachments.first();
                const libPath = path.join(__dirname, '..', '..', 'Lib');
                
                if (!fs.existsSync(libPath)) {
                    fs.mkdirSync(libPath, { recursive: true });
                }
        
                const certificateName = file.name.replace('.p12', '');
                const certificatePath = path.join(libPath, file.name);
        
                const response = await axios.get(file.url, { 
                    responseType: 'arraybuffer',
                    headers: { 'Accept': 'application/octet-stream' }
                });
        
                fs.writeFileSync(certificatePath, Buffer.from(response.data));
                const certificadoBuffer = fs.readFileSync(certificatePath);
                const authData = Buffer.from(`${clientid}:${clientsecret}`).toString("base64");
                const agent = new https.Agent({ pfx: certificadoBuffer, passphrase: "" });
        
                const tokenResponse = await axios.post(
                    "https://pix.api.efipay.com.br/oauth/token",
                    { grant_type: "client_credentials" },
                    {
                        headers: {
                            Authorization: `Basic ${authData}`,
                            "Content-Type": "application/json",
                        },
                        httpsAgent: agent,
                    }
                );
        
                const access_token = tokenResponse.data.access_token;
                const chavesPixResponse = await axios.get("https://pix.api.efipay.com.br/v2/gn/evp", {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    },
                    httpsAgent: agent,
                });
        
                let chavepix = '';
                if (chavesPixResponse.data.chaves.length < 1) {
                    const novaChaveResponse = await axios.post("https://pix.api.efipay.com.br/v2/gn/evp", {}, {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                            "Content-Type": "application/json",
                        },
                        httpsAgent: agent,
                    });
                    chavepix = novaChaveResponse.data.chave;
                } else {
                    chavepix = chavesPixResponse.data.chaves[0];
                }
        
                dbc.set(`pagamentos.certificado`, certificateName);
                dbc.set(`pagamentos.secret_id`, clientid);
                dbc.set(`pagamentos.chavepix`, chavepix);
                dbc.set(`pagamentos.secret_token`, clientsecret);
        
                await msg.delete().catch(() => {});
        
                await interaction.editReply({
                    content: `\`${dbe.get("6")}\` Configuração concluída com sucesso!`,
                    ephemeral: true
                });
        
            } catch (error) {
                
                if (error.name === 'TypeError' && error.message.includes('time')) {
                    await interaction.editReply({
                        content: `\`${dbe.get("13")}\` Tempo esgotado. Por favor, tente novamente.`,
                        ephemeral: true
                    });
                    return;
                }
        
                await interaction.editReply({
                    content: `\`${dbe.get("13")}\` Ocorreu um erro, as credenciais provavelmente estão inválidas.`,
                    ephemeral: true
                });
            }
        }

        if (interaction.customId === `config_pagamentos_testar`) {
            paymentEfiPay(interaction)
        }

        if (interaction.customId === `SelectBlockBank`) {
            const selectedValues = interaction.values;
            
            const bankMappings = {
                'mercado_pago': 'Mercadopago.com',
                'inter': 'Banco Inter',
                'picpay': 'PicPay',
                'nubank': 'Nu Pagamentos',
                'pagseguro': 'BancoSeguro',
                'c6': 'Banco C6',
            };
            
            let blockedBanks = await dbc.get('pagamentos.efiblocks') || [];

            selectedValues.forEach(value => {
                const bank = bankMappings[value];
                if (blockedBanks.includes(bank)) {
                    blockedBanks = blockedBanks.filter(b => b !== bank);
                } else {
                    blockedBanks.push(bank);
                }
            });
            
            await dbc.set('pagamentos.efiblocks', blockedBanks);
        
            const banksBloqued = blockedBanks.length > 0 ? blockedBanks.map(entry => `||${entry}||\n`).join('') : 'Nenhum banco bloqueado';
            

            efiblock()
        }
        
        
        
        

        async function efiblock() {
            let emjvol = dbep.get(`29`)
            let banksBloqued = "";
            const blockedBanks = await dbc.get("pagamentos.efiblocks");
            if (blockedBanks && blockedBanks.length > 0) {
                blockedBanks.forEach((entry) => {
                    banksBloqued += `**${entry}**\n`;
                });
            } else {
                banksBloqued = "`🔴 Nenhum Banco bloqueado`";
            }

            const embed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.user.globalName} - Bloquear Bancos`, iconURL: interaction.user.displayAvatarURL() })
            .setThumbnail(interaction.user.displayAvatarURL())
            .setDescription("-# `🚫` Utilize o menu abaixo para selecionar os bancos que você deseja bloquear durante o processo de compra.")
            .addFields({ name: "Bancos", value: banksBloqued, inline: true})
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
            .setTimestamp()

            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("SelectBlockBank")
                    .setPlaceholder('🔴 Menu de bloqueio')
                    .addOptions([
                        {
                            label: 'Mercado Pago',
                            value: 'mercado_pago',
                            description: 'Bloquear Mercado Pago',
                        },
                        {
                            label: 'Inter',
                            value: 'inter',
                            description: 'Bloquear Inter',
                        },
                        {
                            label: 'Picpay',
                            value: 'picpay',
                            description: 'Bloquear Picpay',
                        },
                        {
                            label: 'Nubank',
                            value: 'nubank',
                            description: 'Bloquear Nubank',
                        },
                        {
                            label: 'Pagseguro',
                            value: 'pagseguro',
                            description: 'Bloquear Pagseguro',
                        },
                        {
                            label: 'C6',
                            value: 'c6',
                            description: 'Bloquear C6',
                        },
                    ])
            );
            


            await interaction.update({ embeds: [embed], components: [row, new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(2).setCustomId(`config_pagamentos_EfiBank`).setLabel(`Voltar`).setEmoji(emjvol),)] })


        }


        async function EfiBank() {
      
            let sistema = `\`🔴 Desligado\``
            let banksBloqued = "";
            const blockedBanks = await dbc.get("pagamentos.efiblocks");
            if (blockedBanks && blockedBanks.length > 0) {
                blockedBanks.forEach((entry) => {
                    banksBloqued += `**${entry}**\n`;
                });
            } else {
                banksBloqued = "`🔴 Nenhum Banco bloqueado`";
            }
            if (dbc.get(`pagamentos.sistema_efi`) === "ON") sistema = `\`🟢 Ligado\``
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Pagamentos", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de vendas automáticas usando \"EfiPay\" e veja algumas informações abaixo.`)
            .addFields(
                {
                    name: `Sistema Automático:`,
                    value: `${sistema}`,
                    inline:true
                },
                {
                    name: "Informações",
                    value: `\`${dbc.get(`pagamentos.secret_token`) ? `Configurado` : "Não Configurado"} / ${dbc.get(`pagamentos.secret_id`) ? `Configurado` : "Não Configurado"}\``,
                    inline:true
                },
                {
                    name: "Bancos Bloqueados:",
                    value: `${banksBloqued}`,
                    inline:true
                },
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            let emjon = dbep.get(`4`)
            let emjoff = dbep.get(`2`)
            let emjmp = dbep.get(`16`)
            let emjesc = dbep.get(`22`)
            let emjvol = dbep.get(`29`)
            let emjefi = dbep.get("45")
            let emjbank = dbep.get("17")

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`pagamentos.sistema_efi`) === "ON" ? 3 : 4)
                .setCustomId(`config_pagamentos_efi_sistema`)
                .setLabel("Sistema")
                .setEmoji(dbc.get(`pagamentos.sistema_efi`) === "ON" ? emjon : emjoff),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_secretconfig`)
                .setLabel(`Alterar Configurações`)
                .setEmoji(emjefi),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_efiblock`)
                .setLabel(`Bloquear Bancos`)
                .setEmoji(emjbank),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos_método`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol),
            )
            await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
}

    }
              }
