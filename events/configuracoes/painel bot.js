const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder} = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbp = new JsonDatabase({ databasePath: "./json/perms.json"})
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json"})
const pkg = new JsonDatabase({ databasePath: "./package.json"})
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json"})
const Discord = require("discord.js")
const { channel } = require("diagnostics_channel")
const dbep = new JsonDatabase({ databasePath: "./json/emojisGlob.json"})
const cfg = new JsonDatabase({ databasePath: "./json/configGlob.json"})
const dbs = new JsonDatabase({ databasePath: "./json/saldo.json"})
module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        async function config_auth(interaction) {
            const cargo = interaction.guild.roles.cache.get(dbc.get("auth.cargo"))
            const embed = new EmbedBuilder()
            .setAuthor({ name: `Configurando Auth (eSync)`, iconURL: interaction.user.displayAvatarURL()})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user}. 👋\n- Configure o seu auth e veja algumas informações à seguir.`)
            .addFields(
                { name: "Obrigatório para fazer compras?", value: `${dbc.get("auth.req") === "ON" ? "`🟢 Sim`" : "`🔴 Não`"}`, inline:false },
                { name: "Credenciais:", value: `- **Client ID:** ${dbc.get("auth.clientId") ? `||${dbc.get("auth.clientId")}||` : "Não Definido" }.\n- **Client Secret:** ${dbc.get("auth.clientSecret") ? `||${dbc.get("auth.clientSecret")}||` : "Não Definido" }.`, inline:true },
                { name: "Cargo Recebido:", value: `${cargo ? cargo : "Não Definido"}`, inline:false },
            )
            .setFooter({ text: "🚨 Aviso! O sistema de eSync estará grátis por tempo limitado, então aproveite."})

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get("auth.req") === "ON" ? 3 : 4) 
                .setCustomId("config_auth_req")
                .setLabel(`Obrigatório? (${dbc.get("auth.req") === "ON" ? 'Sim' : 'Não'})`),
                new ButtonBuilder()
                .setStyle(3)
                .setCustomId("config_auth_editar")
                .setLabel("Editar")
                .setEmoji(dbep.get("1")),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId("config_auth_enviarmsg")
                .setLabel("Fazer Mensagem")
                .setEmoji(dbep.get("18")),
            )
            const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId("config_auth_puxar")
                .setLabel("Puxar Membros")
                .setEmoji(dbep.get('15')),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId("config_auth_webhooks")
                .setLabel('Editar Webhooks')
                .setEmoji(dbep.get('44')),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId("config_voltar")
                .setLabel("Voltar")
                .setEmoji(dbep.get("29"))
            )
            await interaction.update({ embeds: [embed], components: [row, row2]})
        }
        if (interaction.customId === "config_auth") {
            config_auth(interaction)
        } 
        if (interaction.customId === "config_auth_enviarmsg") {
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('title')
                    .setLabel('⠀Titulo')
                    .setStyle(2),
                new ButtonBuilder()
                    .setCustomId('desc')
                    .setLabel('Descrição')
                    .setStyle(2),
                new ButtonBuilder()
                    .setCustomId('image')
                    .setLabel('Imagem')
                    .setStyle(2),
                new ButtonBuilder()
                    .setCustomId('tumb')
                    .setLabel('Miniatura')
                    .setStyle(2),
            )
            const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('autor')
                    .setLabel('⠀Author⠀')
                    .setStyle(2),
                new ButtonBuilder()
                    .setCustomId('footer')
                    .setLabel('⠀Rodapé⠀')
                    .setStyle(2),
                new ButtonBuilder()
                    .setCustomId('date')
                    .setLabel('⠀Data⠀')
                    .setStyle(2),
                new ButtonBuilder()
                    .setCustomId('cor')
                    .setLabel('⠀Cor⠀')
                    .setStyle(2),
            )
            const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('cancelar')
                    .setLabel('Cancelar')
                    .setStyle(4),
                new ButtonBuilder()
                    .setCustomId('send')
                    .setLabel('⠀⠀⠀⠀⠀Enviar⠀⠀⠀⠀⠀')
                    .setStyle(3),
                new ButtonBuilder()
                    .setCustomId('previw')
                    .setLabel('⠀Preview⠀')
                    .setStyle(1),
            )
            interaction.reply({ content: `Personalize a sua embed.`, components: [row, row2, row3], ephemeral:true}).then(async(msg) => {
                const interação = interaction.channel.createMessageComponentCollector({
                    componentType: Discord.ComponentType.Button,
                })
                const embed = new EmbedBuilder()
                interação.on("collect", async (i) => {
                    if (i.customId == 'cancelar') {
                        i.deferUpdate().catch()
                        i.deleteReply().catch()
                    }
                    if (i.customId == 'previw') {
                        i.reply({
                            embeds: [embed],
                            ephemeral: true
                        }).catch(err => {
                            i.reply({
                                content: `${dbe.get(`13`)} | Houve um erro ao processar o anuncio`,
                                ephemeral: true
                            })
                        })
                    }
                    if (i.customId == 'send') {
                        i.deferUpdate()
                        i.deleteReply()
                        channel.send({
                            embeds: [embed],
                            ephemeral: true
                        }).catch(err => {
                            i.reply({
                                content: `${dbe.get(`13`)} | Houve um erro ao processar o anuncio`,
                                ephemeral: true
                            })
                        })
                    }
                    if (i.customId == 'title') {
                        const date = 'edit_' + Date.now();
                        const collectorFilter = i => {
                            return i.user.id === interaction.user.id && i.customId == date;
                        };
    
                        const modal = new ModalBuilder()
                            .setCustomId(date)
                            .setTitle('Title')
                            .addComponents(
                                new ActionRowBuilder()
                                    .addComponents(
                                        new TextInputBuilder()
                                            .setCustomId('text')
                                            .setLabel("Qual seria o titulo?")
                                            .setStyle(1)
                                    )
                            )
                        i.showModal(modal)
                        i.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                            .then(interaction => {
                                interaction.deferUpdate();
                                embed.setTitle(`${interaction.fields.getTextInputValue('text')}`)
                            })
                            .catch(err => { return err });
                    }
                    if (i.customId == 'desc') {
                        const date = 'edit_' + Date.now();
                        const collectorFilter = i => {
                            return i.user.id === inter.user.id && i.customId == date;
                        };
    
                        const modal = new ModalBuilder()
                            .setCustomId(date)
                            .setTitle('Desc')
                            .addComponents(
                                new ActionRowBuilder()
                                    .addComponents(
                                        new TextInputBuilder()
                                            .setCustomId('text')
                                            .setLabel("Qual seria a desc?")
                                            .setStyle(2)
                                    )
                            )
                        i.showModal(modal)
                        i.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                            .then(interaction => {
                                interaction.deferUpdate();
                                embed.setDescription(`${interaction.fields.getTextInputValue('text')}`)
                            })
                            .catch(err => { return err });
                    }
                    if (i.customId == 'image') {
                        const date = 'edit_' + Date.now();
                        const collectorFilter = i => {
                            return i.user.id === inter.user.id && i.customId == date;
                        };
    
                        const modal = new ModalBuilder()
                            .setCustomId(date)
                            .setTitle('Image')
                            .addComponents(
                                new ActionRowBuilder()
                                    .addComponents(
                                        new TextInputBuilder()
                                            .setCustomId('text')
                                            .setLabel("Qual seria a imagem? Coloque link")
                                            .setStyle(1)
                                    )
                            )
                        i.showModal(modal)
                        i.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                            .then(interaction => {
                                interaction.deferUpdate();
                                embed.setImage(`${interaction.fields.getTextInputValue('text')}`)
                            })
                            .catch(err => { return err });
                    }
                    if (i.customId == 'tumb') {
                        const date = 'edit_' + Date.now();
                        const collectorFilter = i => {
                            return i.user.id === inter.user.id && i.customId == date;
                        };
    
                        const modal = new ModalBuilder()
                            .setCustomId(date)
                            .setTitle('Tumb')
                            .addComponents(
                                new ActionRowBuilder()
                                    .addComponents(
                                        new TextInputBuilder()
                                            .setCustomId('text')
                                            .setLabel("Qual seria a Tumb? Coloque link")
                                            .setStyle(1)
                                    )
                            )
                        i.showModal(modal)
                        i.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                            .then(interaction => {
                                interaction.deferUpdate();
                                embed.setThumbnail(`${interaction.fields.getTextInputValue('text')}`)
                            })
                            .catch(err => { return err });
                    }
                    if (i.customId == 'footer') {
                        const date = 'edit_' + Date.now();
                        const collectorFilter = i => {
                            return i.user.id === inter.user.id && i.customId == date;
                        };
    
                        const modal = new ModalBuilder()
                            .setCustomId(date)
                            .setTitle('Footer')
                            .addComponents(
                                new ActionRowBuilder()
                                    .addComponents(
                                        new TextInputBuilder()
                                            .setCustomId('text')
                                            .setLabel("Qual seria o footer?")
                                            .setStyle(TextInputStyle.Short)
                                    )
                            )
                        i.showModal(modal)
                        i.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                            .then(interaction => {
                                interaction.deferUpdate();
                                send.setFooter({ text: `${interaction.fields.getTextInputValue('text')}` })
                            })
                            .catch(err => { return err });
                    }
                    if (i.customId == 'date') {
                        i.deferUpdate()
                        embed.setTimestamp()
                    } 
                    if (i.customId == 'cor') {
                        const date = 'edit_' + Date.now();
                        const collectorFilter = i => {
                            return i.user.id === inter.user.id && i.customId == date;
                        };
    
                        const modal = new ModalBuilder()
                            .setCustomId(date)
                            .setTitle('Cor')
                            .addComponents(
                                new ActionRowBuilder()
                                    .addComponents(
                                        new TextInputBuilder()
                                            .setCustomId('text')
                                            .setLabel("Coloque a cor com hexadecimal")
                                            .setStyle(TextInputStyle.Short)
                                    )
                            )
                        i.showModal(modal)
                        i.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                            .then(interaction => {
                                interaction.deferUpdate();
                                embed.setColor(`${interaction.fields.getTextInputValue('text')}`)
                            })
                            .catch(err => { return err });
                    }
                })
            })
        }
        if (interaction.customId === "config_auth_req") {
            dbc.get("auth.req") === "ON" ? dbc.set("auth.req", "OFF") : dbc.set("auth.req", "ON")
            config_auth(interaction)
        }
        if (interaction.customId === "config_auth_editar") {
            const modal = new ModalBuilder()
            .setCustomId('modal_config_auth_editar') 
            .setTitle('Editando Auth')
            
            const text = new TextInputBuilder()
            .setStyle(1)
            .setCustomId("text1")
            .setLabel("Client ID")
            .setPlaceholder('Informe o Client ID do seu bot.')
            .setValue(dbc.get("auth.clientId") || '')

            const text2 = new TextInputBuilder()
            .setStyle(1)
            .setCustomId("text2")
            .setLabel("Client Secret")
            .setPlaceholder('Informe o Client Secret do seu bot.')
            .setValue(dbc.get("auth.clientSecret") || '')

            const text3 = new TextInputBuilder()
            .setStyle(1)
            .setCustomId("text3")
            .setLabel("Cargo ID")
            .setPlaceholder('Informe o ID do cargo que o usuário verificado receberá.')
            .setRequired(false)
            modal.addComponents(new ActionRowBuilder().addComponents(text))
            modal.addComponents(new ActionRowBuilder().addComponents(text2))
            modal.addComponents(new ActionRowBuilder().addComponents(text3))

            interaction.showModal(modal)
        }
        if (interaction.isModalSubmit() && interaction.customId === "modal_config_auth_editar") {
            const axios = require('axios');

            // Função para validar o clientId e o clientSecret
            async function validateCredentials(clientId, clientSecret) {
                const tokenUrl = 'https://discord.com/api/oauth2/token';
                
                // Configurando o payload para a requisição de token
                const data = new URLSearchParams();
                data.append('grant_type', 'client_credentials');
                data.append('scope', 'identify'); // Ou qualquer outro escopo que faça sentido para seu caso
                
                try {
                    // Tenta obter o token de acesso usando clientId e clientSecret
                    const response = await axios.post(tokenUrl, data.toString(), {
                        auth: {
                            username: clientId,
                            password: clientSecret
                        },
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    });
                
                    return true;
                
                } catch (error) {
                    console.error('Credenciais inválidas:', error.response ? error.response.data : error.message);
                    if (error.response.data.error === "invalid_client") {
                        return "invalid_client"
                    }
                    if (error.message) return "BadRequest"
                    return false;
                }
            }
            
            const clientId = interaction.fields.getTextInputValue("text1");
            const clientSecret = interaction.fields.getTextInputValue("text2");
            
            const verificacao = await validateCredentials(clientId, clientSecret)
            if (verificacao === "invalid_client") return interaction.reply({ ephemeral:true, content: `${dbe.get("13")} | **Client ID** ou **Client Secret** inválido(s)!`});
            if (verificacao === "BadRequest") return interaction.reply({ ephemeral:true, content: `${dbe.get("13")} | Coloque credenciais válidas!`});
            
            const cargoId = interaction.fields.getTextInputValue("text3")
            const cargo = interaction.guild.roles.cache.get(cargoId)

            if (cargoId && !cargo) {
                interaction.reply({ content: `${dbe.get("13")} | Cargo inválido!`, ephemeral:true})
            }
            if (cargo) dbc.set("auth.role", cargo.id);

            dbc.set("auth.clientId", clientId)
            dbc.set("auth.clientSecret", clientSecret)
            await config_auth(interaction)
            interaction.followUp({ content: `${dbe.get(`6`)} | Informações alteradas com sucesso!`, ephemeral:true})
        }
        if (interaction.customId === "config_mod") {

            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Sistemas", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure os sistemas que o seu bot tem incluso.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields()

            let emjcom = dbep.get(`34`)
            let emjvol = dbep.get(`29`)
            let emjesc = dbep.get(`22`)
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod_sugest`)
                .setLabel(`Sugestão`)
                .setEmoji(emjcom),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod_logs`)
                .setLabel(`Moderação`)
                .setEmoji(emjesc),
            )
            const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autolock`)
                .setLabel(`Auto Lock`)
                .setEmoji(dbep.get(`17`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autorepost`)
                .setLabel(`Repostagem Auto`)
                .setDisabled(true)
                .setEmoji(dbep.get(`30`)),
            )
            const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_automsg`)
                .setLabel(`Mensagem Auto`)
                .setEmoji(dbep.get(`18`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autorole`)
                .setLabel(`Auto Role`)
                .setDisabled(false)
                .setEmoji(dbep.get(`24`)),
            )
            const row4 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(4)
                .setCustomId(`config_mod_boasvindas`)
                .setLabel(`Boas-Vindas`)
                .setDisabled(false)
                .setEmoji(dbep.get(`41`)),
                new ButtonBuilder()
                .setStyle(4)
                .setCustomId(`config_mod_antifake`)
                .setLabel(`Anti-Fake`)
                .setDisabled(true)
                .setEmoji(dbep.get(`15`)),
            )
            const rowvol = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_voltar`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol),
            )
            interaction.update({ embeds: [embed], components: [row, row2, row3, row4, rowvol], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_mod_logs") {
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Moderação", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure os sistemas de moderação para gerenciar melhor o seu servidor.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields()

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId("config_mod_logs_entrada")
                .setLabel("Entrada & Saída")
                .setEmoji(dbep.get(`41`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId("config_mod_logs_staff")
                .setLabel("Logs Staff")
                .setEmoji(dbep.get(`34`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId("config_mod_logs_block")
                .setLabel("Bloqueador de frases")
                .setEmoji(dbep.get(`17`)),
            )
            const rowvol = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get("29")),
            )
            interaction.update({ embeds: [embed], components: [row, rowvol]})
        }
        async function config_mod_logs_block(interaction) {
            let frases = "";

            const arrayFrases = await dbc.get(`blockerFrases.frases`) || [];
            frases = arrayFrases.map(entry => `\`${entry}\``).join(', ') + '.';

            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Bloqueador de Frases", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o bloqueador de frases para um ambiente controlado no seu servidor.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Frases Registradas:`, value: `${frases !== "." ? frases : "Nenhuma frase registrada."}`, inline:true }
            )

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId("config_mod_logs_block_editar")
                .setLabel("Editar Frases")
                .setEmoji(dbep.get("1")),
                new ButtonBuilder()
                .setStyle(4)
                .setCustomId("config_mod_logs_block_resetar")
                .setLabel("Resetar")
                .setEmoji(dbep.get("6")),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId("config_mod_logs")
                .setLabel("Voltar")
                .setEmoji(dbep.get("29"))
            )

            await interaction.update({ embeds: [embed], components: [row] })
        }
        if (interaction.customId === "config_mod_logs_block") {
            await config_mod_logs_block(interaction)
        }
        if (interaction.customId === "config_mod_logs_block_resetar") {
            dbc.delete("blockerFrases.frases")

            await config_mod_logs_block(interaction)
            interaction.followUp({ content: `${dbe.get("6")} | Resetado!`, ephemeral:true })
        }
        if (interaction.customId === "config_mod_logs_block_editar") {
            let frases = "";

            const arrayFrases = await dbc.get(`blockerFrases.frases`) || [];
            frases = arrayFrases.map(entry => `${entry}`).join(', ');

            const modal = new ModalBuilder()
            .setTitle("Modificando Frases")
            .setCustomId("modal_config_mod_logs_block_editar")

            const text1 = new TextInputBuilder()
            .setStyle(2)
            .setPlaceholder("Separe elas por vírgulas. Exemplo: frase1, frase2")
            .setLabel("Frases")
            .setCustomId("text1")
            .setRequired(false)
            .setValue(frases || "")

            modal.addComponents(new ActionRowBuilder().addComponents(text1))

            interaction.showModal(modal)
        }
        if (interaction.isModalSubmit() && interaction.customId === "modal_config_mod_logs_block_editar") {
            const text = interaction.fields.getTextInputValue("text1")

            const array = text ? text.split(", ") : ""

            text ? dbc.set("blockerFrases.frases", array) : dbc.delete("blockerFrases.frases")

            await config_mod_logs_block(interaction)
            interaction.followUp({ content: `${dbe.get("6")} | Frases alteradas!`, ephemeral:true })
        }
        async function config_mod_logs_staff(interaction) {
            const channelLogs = interaction.guild.channels.cache.get(dbc.get("logsStaff.channel"))

            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Logs Staff", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure as logs do sistema para gerenciar melhor o seu servidor.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Canal Logs`, value: `${channelLogs || "Não Definido"}`, inline:true },
                { name: `Sistemas Ativos/Desativados`, value: `- Mensagens (apagadas e editadas): ${dbc.get(`logsStaff.messages`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}\n- Membros (banidos, desbanidos e expulsos): ${dbc.get(`logsStaff.members`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}\n- Canal de voz (registra a entrada e saida): ${dbc.get(`logsStaff.channelVoice`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}\n`, inline:false },
            )

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId("config_mod_logs_staff_messages")
                .setLabel("Mensagens")
                .setEmoji(dbc.get(`logsStaff.messages`) === "ON" ? dbep.get("4") : dbep.get("2")),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId("config_mod_logs_staff_members")
                .setLabel("Membros")
                .setEmoji(dbc.get(`logsStaff.members`) === "ON" ? dbep.get("4") : dbep.get("2")),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId("config_mod_logs_staff_voice")
                .setLabel("Canal Voz")
                .setEmoji(dbc.get(`logsStaff.channelVoice`) === "ON" ? dbep.get("4") : dbep.get("2")),
            )
            const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(3)
                .setCustomId("config_mod_logs_staff_channel")
                .setLabel("Canal logs")
                .setEmoji(dbep.get("1")),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId("config_mod_logs")
                .setLabel("Voltar")
                .setEmoji(dbep.get("29"))
            )
            await interaction.update({ content: ``, embeds: [embed], components: [row, row2] })
        }
        if (interaction.customId === "config_mod_logs_staff_channel") {
            
            const select = new ActionRowBuilder()
            .addComponents(
                new Discord.ChannelSelectMenuBuilder()
                .setChannelTypes(Discord.ChannelType.GuildText)
                .setCustomId(`select_config_mod_logs_staff_channel`)
                .setMaxValues(1)
                .setPlaceholder(`Selecionar canal`),
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod_logs_staff`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )

            interaction.update({ content: `Defina um canal para que seja enviado as mensagens de logs.`, components: [select, row], embeds: [] })
        }
        if (interaction.isChannelSelectMenu() && interaction.customId === "select_config_mod_logs_staff_channel") {
            const channel = interaction.values[0]

            dbc.set("logsStaff.channel", channel)

            await config_mod_logs_staff(interaction)
            interaction.followUp({ content: `${dbe.get("6")} | Canal <#${channel}> definido com sucesso!`, ephemeral:true })
        }
        if (interaction.customId === "config_mod_logs_staff_messages") {

            dbc.get(`logsStaff.messages`) === "ON" ? dbc.set("logsStaff.messages", "OFF") : dbc.set("logsStaff.messages", "ON")
            
            await config_mod_logs_staff(interaction)
        }
        if (interaction.customId === "config_mod_logs_staff_members") {

            dbc.get(`logsStaff.members`) === "ON" ? dbc.set("logsStaff.members", "OFF") : dbc.set("logsStaff.members", "ON")
            
            await config_mod_logs_staff(interaction)
        }
        if (interaction.customId === "config_mod_logs_staff_voice") {

            dbc.get(`logsStaff.channelVoice`) === "ON" ? dbc.set("logsStaff.channelVoice", "OFF") : dbc.set("logsStaff.channelVoice", "ON")
            
            await config_mod_logs_staff(interaction)
        }
        if (interaction.customId === "config_mod_logs_staff") {
            await config_mod_logs_staff(interaction)
        }
        async function config_mod_logs_entrada(interaction) {
            const logsentrou = interaction.guild.channels.cache.get(dbc.get("logs.entrada.entrou"))
            const logsaiu = interaction.guild.channels.cache.get(dbc.get("logs.entrada.saiu"))
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Logs Moderação", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure as logs do sistema para gerenciar melhor o seu servidor.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Canal Logs Entrada`, value: `${logsentrou || "Não Definido"}`, inline:true },
                { name: `Canal Logs Saída`, value: `${logsaiu || "Não Definido"}`, inline:true },
            )

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId("config_mod_logs_entrada_entrou")
                .setLabel("Logs Entrada"),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId("config_mod_logs_entrada_saida")
                .setLabel("Logs Saida"),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId('config_mod_logs')
                .setLabel("Voltar")
                .setEmoji(dbep.get("29"))
            )
            await interaction.update({ content: ``, embeds: [embed], components: [row]})
        }
        if (interaction.customId === "config_mod_logs_entrada") {
            await config_mod_logs_entrada(interaction)
        }
        if (interaction.customId === "config_mod_logs_entrada_entrou") {
            const select = new ActionRowBuilder()
            .addComponents(
                new Discord.ChannelSelectMenuBuilder()
                .setChannelTypes(Discord.ChannelType.GuildText)
                .setCustomId(`channel_config_mod_logs_entrada_entrou`)
                .setMaxValues(1)
                .setPlaceholder(`Selecione um canal.`),
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(4)
                .setCustomId("config_mod_logs_entrada_resetar_entrou")
                .setLabel("Resetar")
                .setEmoji(dbep.get("6")),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod_logs_entrada`)
                .setEmoji(dbep.get(`29`))
            )

            interaction.update({ embeds: [], content: `Selecione um canal que será mandada as logs de entrada de membros do servidor.`, components: [select, row]})
        }
        if (interaction.customId === "config_mod_logs_entrada_saida") {
            const select = new ActionRowBuilder()
            .addComponents(
                new Discord.ChannelSelectMenuBuilder()
                .setChannelTypes(Discord.ChannelType.GuildText)
                .setCustomId(`channel_config_mod_logs_entrada_saida`)
                .setMaxValues(1)
                .setPlaceholder(`Selecione um canal.`),
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(4)
                .setCustomId("config_mod_logs_entrada_resetar_saida")
                .setLabel("Resetar")
                .setEmoji(dbep.get("6")),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod_logs_entrada`)
                .setEmoji(dbep.get(`29`))
            )

            interaction.update({ embeds: [], content: `Selecione um canal que será mandada as logs de saída de membros do servidor.`, components: [select, row]})
        }
        if (interaction.isButton()) {
            const customId = interaction.customId;

            if (customId.startsWith("config_mod_logs_entrada_resetar")) {
                const valor = customId.split('_')[5]
                if (valor === "entrou") {
                    dbc.delete("logs.entrada.entrou")
                }
                if (valor === 'saida') {
                    dbc.delete("logs.entrada.saiu")
                }
                await config_mod_logs_entrada(interaction)
            }
        }
        if (interaction.isChannelSelectMenu()) {
            const option = interaction.customId;

            if (option === "channel_config_mod_logs_entrada_entrou") {
                const canal = interaction.values[0]
                dbc.set("logs.entrada.entrou", canal)
                config_mod_logs_entrada(interaction)
            }
            if (option === "channel_config_mod_logs_entrada_saida") {
                const canal = interaction.values[0]
                dbc.set("logs.entrada.saiu", canal)
                config_mod_logs_entrada(interaction)
            }
        }
        if (interaction.customId === "config_mod_boasvindas") {
            const canal = interaction.guild.channels.cache.get(dbc.get(`boasvindas.canal`))
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Boas-Vindas", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de boas-vindas para seu bot. Quando um novo membro entrar no seu servidor, o bot enviará automaticamente uma mensagem de boas-vindas no canal selecionado.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`boasvindas.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:true },
                { name: `Canal:`, value: `${canal || "Não Definido."}`, inline: true },
                { name: `Variáveis para usar:`, value: `- Usuário:\n  - **{user}** Menciona o usuário.\n  - **{user.id}** Pega o ID do usuário.\n  - **{user.name}** Pega o nome do usuário.`, inline: false },
                { name: `Mensagem:`, value: `${dbc.get(`boasvindas.msg`) || "Não Definido."}`, inline: true },
                { name: `Tempo de mensagem:`, value: `${dbc.get(`boasvindas.tempo`) ? `\`${dbc.get(`boasvindas.tempo`)} Segundo's para apagar a mensagem.\`` : "Não Definido."}`, inline: true },
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`boasvindas.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_boasvindas_sistema`)
                .setLabel(`Sistema ${dbc.get(`boasvindas.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`boasvindas.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_boasvindas_editar`)
                .setLabel(`Editar`)
                .setEmoji(dbep.get(`1`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_boasvindas_canal`)
                .setLabel(`Alterar Canal`)
                .setEmoji(dbep.get(`10`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_mod_boasvindas_sistema") {
            dbc.get(`boasvindas.sistema`) === "ON" ? dbc.set(`boasvindas.sistema`, "OFF") : dbc.set(`boasvindas.sistema`, "ON")
            const canal = interaction.guild.channels.cache.get(dbc.get(`boasvindas.canal`))
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Boas-Vindas", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de boas-vindas para seu bot. Quando um novo membro entrar no seu servidor, o bot enviará automaticamente uma mensagem de boas-vindas no canal selecionado.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`boasvindas.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:true },
                { name: `Canal:`, value: `${canal || "Não Definido."}`, inline: true },
                { name: `Variáveis para usar:`, value: `- Usuário:\n  - **{user}** Menciona o usuário.\n  - **{user.id}** Pega o ID do usuário.\n  - **{user.name}** Pega o nome do usuário.`, inline: false },
                { name: `Mensagem:`, value: `${dbc.get(`boasvindas.msg`) || "Não Definido."}`, inline: true },
                { name: `Tempo de mensagem:`, value: `${dbc.get(`boasvindas.tempo`) ? `\`${dbc.get(`boasvindas.tempo`)} Segundo's para apagar a mensagem.\`` : "Não Definido."}`, inline: true },
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`boasvindas.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_boasvindas_sistema`)
                .setLabel(`Sistema ${dbc.get(`boasvindas.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`boasvindas.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_boasvindas_editar`)
                .setLabel(`Editar`)
                .setEmoji(dbep.get(`1`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_boasvindas_canal`)
                .setLabel(`Alterar Canal`)
                .setEmoji(dbep.get(`10`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_mod_boasvindas_editar") {
            const modal = new ModalBuilder()
            .setTitle("Editando Boas-Vindas")
            .setCustomId(`modal_config_mod_boasvindas_editar`)

            const text1 = new TextInputBuilder()
            .setStyle(2)
            .setCustomId("text1")
            .setLabel(`Mensagem de Boas-Vindas`)
            .setPlaceholder(`Coloque a mensagem que será enviada após um usuário entrar no servidor.`)
            .setValue(dbc.get(`boasvindas.msg`) || "")

            const text2 = new TextInputBuilder()
            .setStyle(1)
            .setCustomId("text2")
            .setLabel(`Tempo de Mensagem (segundos)`)
            .setRequired(false)
            .setPlaceholder(`Coloque o que a mensagem de boas-vindas será apagada.`)
            .setValue(dbc.get(`boasvindas.tempo`) || "")
            modal.addComponents(new ActionRowBuilder().addComponents(text1))
            modal.addComponents(new ActionRowBuilder().addComponents(text2))

            interaction.showModal(modal)
        }
        if (interaction.isModalSubmit() && interaction.customId === "modal_config_mod_boasvindas_editar") {
            const msg = interaction.fields.getTextInputValue("text1")
            const tempo = interaction.fields.getTextInputValue("text2")

            if (tempo && !/\d/.test(tempo)) {
                interaction.reply({ ephemeral:true, content: `${dbe.get(`13`)} | Tempo inválido!`})
                return
            } else if (tempo && tempo <= 0) {
                interaction.reply({ ephemeral:true, content: `${dbe.get(`13`)} | O tempo não pode ser zero! Caso queira retirar, simplesmente apague-o.`})
                return
            }

            dbc.set(`boasvindas.msg`, msg)
            if (tempo) {
                dbc.set(`boasvindas.tempo`, tempo || "")
            } else {
                
                dbc.delete(`boasvindas.tempo`)
            }

            const canal = interaction.guild.channels.cache.get(dbc.get(`boasvindas.canal`))
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Boas-Vindas", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de boas-vindas para seu bot. Quando um novo membro entrar no seu servidor, o bot enviará automaticamente uma mensagem de boas-vindas no canal selecionado.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`boasvindas.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:true },
                { name: `Canal:`, value: `${canal || "Não Definido."}`, inline: true },
                { name: `Variáveis para usar:`, value: `- Usuário:\n  - **{user}** Menciona o usuário.\n  - **{user.id}** Pega o ID do usuário.\n  - **{user.name}** Pega o nome do usuário.`, inline: false },
                { name: `Mensagem:`, value: `${dbc.get(`boasvindas.msg`) || "Não Definido."}`, inline: true },
                { name: `Tempo de mensagem:`, value: `${dbc.get(`boasvindas.tempo`) ? `\`${dbc.get(`boasvindas.tempo`)} Segundo's para apagar a mensagem.\`` : "Não Definido."}`, inline: true },
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`boasvindas.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_boasvindas_sistema`)
                .setLabel(`Sistema ${dbc.get(`boasvindas.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`boasvindas.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_boasvindas_editar`)
                .setLabel(`Editar`)
                .setEmoji(dbep.get(`1`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_boasvindas_canal`)
                .setLabel(`Alterar Canal`)
                .setEmoji(dbep.get(`10`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
            interaction.followUp({ ephemeral:true, content: `${dbe.get(`6`)} | Informações alteradas!`})
        }
        if (interaction.customId === "config_mod_boasvindas_canal") {
            const select = new ActionRowBuilder()
            .addComponents(
                new Discord.ChannelSelectMenuBuilder()
                .setChannelTypes(Discord.ChannelType.GuildText)
                .setCustomId(`config_mod_boasvindas_channel_select`)
                .setMaxValues(1)
                .setPlaceholder(`Selecione um canal.`),
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod_boasvindas`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            const canal = interaction.guild.channels.cache.get(dbc.get(`boasvindas.canal`))
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Boas-Vindas", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Selecione o canal que será mandado a mensagem que foi definida no bot.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`boasvindas.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:true },
                { name: `Canal:`, value: `${canal || "Não Definido."}`, inline: true },
                { name: `Variáveis para usar:`, value: `- Usuário:\n  - **{user}** Menciona o usuário.\n  - **{user.id}** Pega o ID do usuário.\n  - **{user.name}** Pega o nome do usuário.`, inline: false },
                { name: `Mensagem:`, value: `${dbc.get(`boasvindas.msg`) || "Não Definido."}`, inline: true },
                { name: `Tempo de mensagem:`, value: `${dbc.get(`boasvindas.tempo`) ? `\`${dbc.get(`boasvindas.tempo`)} Segundo's para apagar a mensagem.\`` : "Não Definido."}`, inline: true },
            )
            interaction.update({ embeds: [embed], components: [select, row]})  
        }
        if (interaction.isChannelSelectMenu() && interaction.customId === "config_mod_boasvindas_channel_select") {
            const values = interaction.values[0]
            dbc.set(`boasvindas.canal`, values)
            const canal = interaction.guild.channels.cache.get(dbc.get(`boasvindas.canal`))
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Boas-Vindas", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de boas-vindas para seu bot. Quando um novo membro entrar no seu servidor, o bot enviará automaticamente uma mensagem de boas-vindas no canal selecionado.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`boasvindas.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:true },
                { name: `Canal:`, value: `${canal || "Não Definido."}`, inline: true },
                { name: `Variáveis para usar:`, value: `- Usuário:\n  - **{user}** Menciona o usuário.\n  - **{user.id}** Pega o ID do usuário.\n  - **{user.name}** Pega o nome do usuário.`, inline: false },
                { name: `Mensagem:`, value: `${dbc.get(`boasvindas.msg`) || "Não Definido."}`, inline: true },
                { name: `Tempo de mensagem:`, value: `${dbc.get(`boasvindas.tempo`) ? `\`${dbc.get(`boasvindas.tempo`)} Segundo's para apagar a mensagem.\`` : "Não Definido."}`, inline: true },
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`boasvindas.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_boasvindas_sistema`)
                .setLabel(`Sistema ${dbc.get(`boasvindas.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`boasvindas.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_boasvindas_editar`)
                .setLabel(`Editar`)
                .setEmoji(dbep.get(`1`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_boasvindas_canal`)
                .setLabel(`Alterar Canal`)
                .setEmoji(dbep.get(`10`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
            interaction.followUp({ ephemeral:true, content: `${dbe.get(`6`)} | Canal definido!`})
        }
        if (interaction.customId === "config_mod_autorole") {
            let cargos = ""
            const cargosdb = dbc.get(`autorole.cargos`) || []
            await cargosdb.map(async(entry) => {
                cargos += `- <@&${entry}>\n`
            })
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Cargo Automático", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o cargo automático. Quando algum membro entrar no seu servidor ele receberá o's cargo's definido's.\n\n> ⚠️ É necessário que o bot tenha um cargo acima do's cargo's selecionado's.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`autorole.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:false },
                { name: `Cargo's Configurado's:`, value: `${cargos || "Sem cargo's configurado's."}`, inline: false }
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`autorole.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_autorole_sistema`)
                .setLabel(`Sistema ${dbc.get(`autorole.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`autorole.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autorole_roles`)
                .setLabel(`Gerenciar Cargos`)
                .setEmoji(dbep.get(`24`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_mod_autorole_sistema") {
            dbc.get(`autorole.sistema`) === "ON" ? dbc.set(`autorole.sistema`, "OFF") : dbc.set(`autorole.sistema`, "ON")
            let cargos = ""
            const cargosdb = dbc.get(`autorole.cargos`) || []
            await cargosdb.map(async(entry) => {
                cargos += `- <@&${entry}>\n`
            })
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Cargo Automático", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o cargo automático. Quando algum membro entrar no seu servidor ele receberá o's cargo's definido's.\n\n> ⚠️ É necessário que o bot tenha um cargo acima do's cargo's selecionado's.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`autorole.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:false },
                { name: `Cargo's Configurado's:`, value: `${cargos || "Sem cargo's configurado's."}`, inline: false }
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`autorole.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_autorole_sistema`)
                .setLabel(`Sistema ${dbc.get(`autorole.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`autorole.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autorole_roles`)
                .setLabel(`Gerenciar Cargos`)
                .setEmoji(dbep.get(`24`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_mod_autorole_roles") {
            const select = new ActionRowBuilder()
            .addComponents(
                new Discord.RoleSelectMenuBuilder()
                .setCustomId(`config_mod_autorole_roles_select`)
                .setMaxValues(20)
                .setPlaceholder(`Selecione o's cargo's.`),
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(4)
                .setCustomId("config_mod_autorole_roles_reset")
                .setLabel(`Resetar Cargos`)
                .setEmoji(dbep.get(`6`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod_autorole`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            interaction.update({ embeds: [
                new EmbedBuilder()
                .setAuthor({ name: `Configurando Cargos Auto Role`, iconURL: interaction.guild.iconURL({ dynamic: true})})
                .setDescription(`Selecione o's cargo's que será dado após alguma pessoa entrar no servidor.`)
                .setColor(dbc.get(`color`) || "Default")
            ], components: [select, row]})  
        }
        if (interaction.customId === "config_mod_autorole_roles_reset") {
            dbc.set(`autorole.cargos`, []) 
            let cargos = ""
            const cargosdb = dbc.get(`autorole.cargos`) || []
            await cargosdb.map(async(entry) => {
                cargos += `- <@&${entry}>\n`
            })
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Cargo Automático", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o cargo automático. Quando algum membro entrar no seu servidor ele receberá o's cargo's definido's.\n\n> ⚠️ É necessário que o bot tenha um cargo acima do's cargo's selecionado's.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`autorole.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:false },
                { name: `Cargo's Configurado's:`, value: `${cargos || "Sem cargo's configurado's."}`, inline: false }
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`autorole.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_autorole_sistema`)
                .setLabel(`Sistema ${dbc.get(`autorole.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`autorole.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autorole_roles`)
                .setLabel(`Gerenciar Cargos`)
                .setEmoji(dbep.get(`24`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
            interaction.followUp({ content: `${dbe.get(`6`)} | Cargo's resetado's com sucesso!`, ephemeral:true})
        }
        if (interaction.isRoleSelectMenu() && interaction.customId === "config_mod_autorole_roles_select") {
            const value_cargos = interaction.values;
            dbc.set(`autorole.cargos`, value_cargos)
            let cargos = ""
            const cargosdb = dbc.get(`autorole.cargos`) || []
            await cargosdb.map(async(entry) => {
                cargos += `- <@&${entry}>\n`
            })
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Cargo Automático", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o cargo automático. Quando algum membro entrar no seu servidor ele receberá o's cargo's definido's.\n\n> ⚠️ É necessário que o bot tenha um cargo acima do's cargo's selecionado's.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`autorole.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:false },
                { name: `Cargo's Configurado's:`, value: `${cargos || "Sem cargo's configurado's."}`, inline: false }
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`autorole.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_autorole_sistema`)
                .setLabel(`Sistema ${dbc.get(`autorole.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`autorole.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autorole_roles`)
                .setLabel(`Gerenciar Cargos`)
                .setEmoji(dbep.get(`24`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
            interaction.followUp({ content: `${dbe.get(`6`)} | Cargo's configurado's!`, ephemeral:true})
        }
        if (interaction.customId === "config_mod_automsg") {
            let canais = ""
            dbc.get(`automsg.canais`).map(async(entry) => {
                canais += `- Canal: <#${entry.id}>. Tempo de repost: \`${entry.tempo} minuto's\`.\n`
            })
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Cargo Automático", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de mensagens automáticas. Ele é utilizado para fornecer informações visíveis a todos os membros no chat.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`automsg.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:false },
                { name: `Canais Configurados:`, value: `${canais || "Sem canais configurado."}`, inline: false }
            )

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`automsg.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_automsg_sistema`)
                .setLabel(`Sistema ${dbc.get(`automsg.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`automsg.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_automsg_criar`)
                .setLabel(`Criar Configuração`)
                .setEmoji(dbep.get(`20`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_automsg_editar`)
                .setLabel(`Editar Configuração`)
                .setEmoji(dbep.get(`1`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_mod_automsg_editar") {
            if (dbc.get(`automsg.canais`) <= 0) {
                interaction.reply({ content: `${dbe.get(`13`)} | Nenhuma configuração criada!`, ephemeral:true})
                return;
            }
            const select = new StringSelectMenuBuilder()
            .setCustomId('select_config_mod_automsg_editar')
            .setPlaceholder(`Selecione uma configuração para editar.`)

            await dbc.get(`automsg.canais`).map(async(entry) => {
                const canal = interaction.guild.channels.cache.get(entry.id)
                select.addOptions(
                    {
                        label: `Canal: ${canal.name || "Não encontrado..."} | Tempo de Repost: ${entry.tempo} minuto's`,
                        description: `ID do canal ${entry.id}.`,
                        value: `${entry.id}`
                    }
                )
            })

            const row = new ActionRowBuilder()
            .addComponents(select)

            const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod_automsg`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            interaction.update({components: [row,row2]})
        }
        if (interaction.isStringSelectMenu() && interaction.customId === "select_config_mod_automsg_editar") {
            const id = interaction.values[0];
            const ids = dbc.get(`automsg.canais`) 
            const configura = ids.find(a => a.id === id)
            if (!ids.find(a => a.id === id)) {
                interaction.reply({ content: `${dbe.get(`13`)} | Configuração não encontrada!`, ephemeral:true})
                return;
            }
            const modal = new ModalBuilder()
            .setTitle("Editando Configuração")
            .setCustomId(`${configura.id}_modal_config_mod_automsg_editar`)

            const text = new TextInputBuilder()
            .setStyle(1)
            .setCustomId("text1")
            .setLabel(`ID do canal`)
            .setPlaceholder(`Coloque o id do canal que a configuração funcionará.`)
            .setValue(configura.id)

            const text2 = new TextInputBuilder()
            .setStyle(1)
            .setCustomId("text2")
            .setLabel(`Tempo de Repost (minutos)`)
            .setPlaceholder(`Coloque o tempo que a mensagem será repostada.`)
            .setValue(configura.tempo)

            const text3 = new TextInputBuilder()
            .setStyle(2)
            .setCustomId("text3")
            .setLabel(`Mensagem`)
            .setPlaceholder(`Coloque a mensagem que será postada.`)
            .setValue(configura.msg)

            const text4 = new TextInputBuilder()
            .setStyle(1)
            .setCustomId("text4")
            .setLabel(`Excluir configuração`)
            .setPlaceholder(`Escreva SIM caso queira excluir esta configuração.`)
            .setRequired(false)
            modal.addComponents(new ActionRowBuilder().addComponents(text))
            modal.addComponents(new ActionRowBuilder().addComponents(text2))
            modal.addComponents(new ActionRowBuilder().addComponents(text3))
            modal.addComponents(new ActionRowBuilder().addComponents(text4))

            interaction.showModal(modal)
        }
        if (interaction.isModalSubmit() && interaction.customId.endsWith("_modal_config_mod_automsg_editar")) {
            const id = interaction.customId.split("_")[0]
            const ids = dbc.get(`automsg.canais`) 
            const configura = ids.find(a => a.id === id)
            const index = ids.findIndex(a => a.id === id)
            if (!ids.find(a => a.id === id)) {
                interaction.reply({ content: `${dbe.get(`13`)} | Configuração não encontrada!`, ephemeral:true})
                return;
            }
            const channelId = interaction.fields.getTextInputValue("text1")
            const tempo = interaction.fields.getTextInputValue("text2")
            const msg = interaction.fields.getTextInputValue("text3")
            const exc = interaction.fields.getTextInputValue("text4")
            if (exc) {
                if (exc.toLowerCase() === 'sim') {
                    await ids.splice(index, 1)
                    dbc.set(`automsg.canais`, ids)
                    let canais = ""
                    dbc.get(`automsg.canais`).map(async(entry) => {
                        canais += `- Canal: <#${entry.id}>. Tempo de repost: \`${entry.tempo} minuto's\`.\n`
                    })
                    const embed = new EmbedBuilder()
                    .setAuthor({ name: "Configurando Mensagem Automática", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                    .setColor(dbc.get("color"))
                    .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de mensagens automáticas. Ele é utilizado para fornecer informações visíveis a todos os membros no chat.`)
                    .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
                    .addFields(
                        { name: `Sistema:`, value: `${dbc.get(`automsg.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:false },
                        { name: `Canais Configurados:`, value: `${canais || "Sem canais configurado."}`, inline: false }
                    )
        
                    const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setStyle(dbc.get(`automsg.sistema`) === "ON" ? 3 : 4)
                        .setCustomId(`config_mod_automsg_sistema`)
                        .setLabel(`Sistema ${dbc.get(`automsg.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                        .setEmoji(dbc.get(`automsg.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId(`config_mod_automsg_criar`)
                        .setLabel(`Criar Configuração`)
                        .setEmoji(dbep.get(`20`)),
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId(`config_mod_automsg_editar`)
                        .setLabel(`Editar Configuração`)
                        .setEmoji(dbep.get(`1`)),
                        new ButtonBuilder()
                        .setStyle(1)
                        .setCustomId(`config_mod`)
                        .setLabel(`Voltar`)
                        .setEmoji(dbep.get(`29`)),
                    )
                    await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
                    interaction.followUp({ content: `${dbe.get(`6`)} | Configuração apagada com sucesso!`, ephemeral:true})
                    return
                }
            }
            const channel = interaction.guild.channels.cache.get(channelId)

            if (!channel) {
                interaction.reply({ content: `${dbe.get(`13`)} | Canal inválido!`, ephemeral:true})
                return;
            }
            if (isNaN(tempo)) {
                interaction.reply({ content: `${dbe.get(`13`)} | Tempo inválido!`, ephemeral:true})
                return;
            }
            ids[index].id = channel.id
            ids[index].tempo = tempo
            ids[index].msg = msg

            dbc.set(`automsg.canais`, ids)
            let canais = ""
            dbc.get(`automsg.canais`).map(async(entry) => {
                canais += `- Canal: <#${entry.id}>. Tempo de repost: \`${entry.tempo} minuto's\`.\n`
            })
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Mensagem Automática", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de mensagens automáticas. Ele é utilizado para fornecer informações visíveis a todos os membros no chat.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`automsg.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:false },
                { name: `Canais Configurados:`, value: `${canais || "Sem canais configurado."}`, inline: false }
            )

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`automsg.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_automsg_sistema`)
                .setLabel(`Sistema ${dbc.get(`automsg.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`automsg.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_automsg_criar`)
                .setLabel(`Criar Configuração`)
                .setEmoji(dbep.get(`20`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_automsg_editar`)
                .setLabel(`Editar Configuração`)
                .setEmoji(dbep.get(`1`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
            interaction.followUp({ content: `${dbe.get(`6`)} | Informações alteradas com sucesso!`, ephemeral:true})
        }
        if (interaction.customId === "config_mod_automsg_sistema") {
            dbc.get(`automsg.sistema`) === "ON" ? dbc.set(`automsg.sistema`, "OFF") : dbc.set(`automsg.sistema`, "ON")
            let canais = ""
            dbc.get(`automsg.canais`).map(async(entry) => {
                canais += `- Canal: <#${entry.id}>. Tempo de repost: \`${entry.tempo} minuto's\`.\n`
            })
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Mensagem Automática", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de mensagens automáticas. Ele é utilizado para fornecer informações visíveis a todos os membros no chat.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`automsg.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:false },
                { name: `Canais Configurados:`, value: `${canais || "Sem canais configurado."}`, inline: false }
            )

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`automsg.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_automsg_sistema`)
                .setLabel(`Sistema ${dbc.get(`automsg.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`automsg.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_automsg_criar`)
                .setLabel(`Criar Configuração`)
                .setEmoji(dbep.get(`20`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_automsg_editar`)
                .setLabel(`Editar Configuração`)
                .setEmoji(dbep.get(`1`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_mod_automsg_criar") {
            const modal = new ModalBuilder()
            .setTitle("Criando Configuração")
            .setCustomId(`modal_config_mod_automsg_criar`)

            const text = new TextInputBuilder()
            .setStyle(1)
            .setCustomId("text1")
            .setLabel(`ID do canal`)
            .setPlaceholder(`Coloque o id do canal que a configuração funcionará.`)

            const text2 = new TextInputBuilder()
            .setStyle(1)
            .setCustomId("text2")
            .setLabel(`Tempo de Repost (minutos)`)
            .setPlaceholder(`Coloque o tempo que a mensagem será repostada.`)

            const text3 = new TextInputBuilder()
            .setStyle(2)
            .setCustomId("text3")
            .setLabel(`Mensagem`)
            .setPlaceholder(`Coloque a mensagem que será postada.`)

            modal.addComponents(new ActionRowBuilder().addComponents(text))
            modal.addComponents(new ActionRowBuilder().addComponents(text2))
            modal.addComponents(new ActionRowBuilder().addComponents(text3))

            interaction.showModal(modal)
        }
        if (interaction.isModalSubmit() && interaction.customId === "modal_config_mod_automsg_criar") {
            const channelId = interaction.fields.getTextInputValue("text1")
            const tempo = interaction.fields.getTextInputValue("text2")
            const msg = interaction.fields.getTextInputValue("text3")
            const channel = interaction.guild.channels.cache.get(channelId)

            if (!channel) {
                interaction.reply({ content: `${dbe.get(`13`)} | Canal inválido!`, ephemeral:true})
                return;
            }
            if (isNaN(tempo)) {
                interaction.reply({ content: `${dbe.get(`13`)} | Tempo inválido!`, ephemeral:true})
                return;
            }

            dbc.push(`automsg.canais`, {
                id: channelId,
                tempo: tempo,
                msg: msg
            })
            let canais = ""
            dbc.get(`automsg.canais`).map(async(entry) => {
                canais += `- Canal: <#${entry.id}>. Tempo de repost: \`${entry.tempo} minuto's\`.\n`
            })
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Mensagem Automática", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de mensagens automáticas. Ele é utilizado para fornecer informações visíveis a todos os membros no chat.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`automsg.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:false },
                { name: `Canais Configurados:`, value: `${canais || "Sem canais configurado."}`, inline: false }
            )

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`automsg.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_automsg_sistema`)
                .setLabel(`Sistema ${dbc.get(`automsg.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`automsg.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_automsg_criar`)
                .setLabel(`Criar Configuração`)
                .setEmoji(dbep.get(`20`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_automsg_editar`)
                .setLabel(`Editar Configuração`)
                .setEmoji(dbep.get(`1`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
            interaction.followUp({ ephemeral:true, content: `${dbe.get(`6`)} | Configuração criada com sucesso!`})
        }
        if (interaction.customId === "config_mod_autorepost") {
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Auto Repost", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de auto repost. O auto repost reposta todos os anúncios que ja estão setados nos canais deles no horário que foi definido.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`autorepost.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:true },
                { name: `Horário Repost:`, value: `- Horário da repostagem: ${dbc.get('autorepost.hr').split(':')[0] < 12 ? `**__${dbc.get('autorepost.hr')}__** da manhã` : dbc.get('autorepost.hr').split(':')[0] >= 12 && dbc.get('autorepost.hr').split(':')[0] < 18 ? `**__${dbc.get('autorepost.hr')}__** da tarde` : `**__${dbc.get('autorepost.hr')}__** da noite`}.`, inline: false }
            )

            
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`autorepost.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_autorepost_sistema`)
                .setLabel(`Sistema ${dbc.get(`autorepost.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`autorepost.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autorepost_horarios`)
                .setLabel(`Alterar Horários`)
                .setEmoji(dbep.get(`42`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
        } 
        if (interaction.customId === "config_mod_autorepost_horarios") {
            const modal = new ModalBuilder()
            .setTitle("Definindo horário")
            .setCustomId(`modal_config_mod_autorepost_horarios`)

            const text = new TextInputBuilder()
            .setStyle(1)
            .setCustomId("text1")
            .setLabel(`Horário Repostagem (formato HH:MM)`)
            .setPlaceholder(`Ex: 21:32 (Hora e minuto)`)
            .setValue(dbc.get(`autorepost.hr`) || "")

            modal.addComponents(new ActionRowBuilder().addComponents(text))

            interaction.showModal(modal)
        }
        if (interaction.isModalSubmit() && interaction.customId === "modal_config_mod_autorepost_horarios") {
            const text = interaction.fields.getTextInputValue("text1") 
            if (!/^\d{1,2}:\d{2}$/.test(text)) {
                interaction.reply({ content: `${dbe.get(`13`)} | Horário inválido!`, ephemeral:true})
                return;
            }
            dbc.set(`autorepost.hr`, text)

            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Auto Repost", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de auto repost. O auto repost reposta todos os anúncios que ja estão setados nos canais deles no horário que foi definido.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`autorepost.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:true },
                { name: `Horário Repost:`, value: `- Horário da repostagem: ${dbc.get('autorepost.hr').split(':')[0] < 12 ? `**__${dbc.get('autorepost.hr')}__** da manhã` : dbc.get('autorepost.hr').split(':')[0] >= 12 && dbc.get('autorepost.hr').split(':')[0] < 18 ? `**__${dbc.get('autorepost.hr')}__** da tarde` : `**__${dbc.get('autorepost.hr')}__** da noite`}.`, inline: false }
            )

            
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`autorepost.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_autorepost_sistema`)
                .setLabel(`Sistema ${dbc.get(`autorepost.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`autorepost.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autorepost_horarios`)
                .setLabel(`Alterar Horários`)
                .setEmoji(dbep.get(`42`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )

            await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
            interaction.followUp({ ephemeral:true, content: `${dbe.get(`6`)} | Horário modificado com sucesso!`})
        }
        if (interaction.customId === "config_mod_autorepost_sistema") {
            dbc.get(`autorepost.sistema`) === "ON" ? dbc.set(`autorepost.sistema`, "OFF") : dbc.set(`autorepost.sistema`, "ON")
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Auto Repost", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de auto repost. O auto repost reposta todos os anúncios que ja estão setados nos canais deles no horário que foi definido.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`autorepost.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:true },
                { name: `Horário Repost:`, value: `- Horário da repostagem: ${dbc.get('autorepost.hr').split(':')[0] < 12 ? `**__${dbc.get('autorepost.hr')}__** da manhã` : dbc.get('autorepost.hr').split(':')[0] >= 12 && dbc.get('autorepost.hr').split(':')[0] < 18 ? `**__${dbc.get('autorepost.hr')}__** da tarde` : `**__${dbc.get('autorepost.hr')}__** da noite`}.`, inline: false }
            )

            
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`autorepost.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_autorepost_sistema`)
                .setLabel(`Sistema ${dbc.get(`autorepost.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`autorepost.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autorepost_horarios`)
                .setLabel(`Alterar Horários`)
                .setEmoji(dbep.get(`42`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_mod_autolock") {
            let canais = ''
            const channels = await dbc.get(`autolock.canais`) || []
            await channels.map(async(entry) => {canais += `- <#${entry}>\n`;})
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Auto Lock", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- O Auto Lock fecha o chat automaticamente em um horário definido, apagando todas as mensagens para garantir privacidade e segurança.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`autolock.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:true },
                { name: `Canais:`, value: `${canais || "Nenhum canal definido."}`, inline:true, },
                { name: `Horários Lock/UnLock:`, value: `- Fecha às ${dbc.get('autolock.hr1').split(':')[0] < 12 ? `**__${dbc.get('autolock.hr1')}__** da manhã` : dbc.get('autolock.hr1').split(':')[0] >= 12 && dbc.get('autolock.hr1').split(':')[0] < 18 ? `**__${dbc.get('autolock.hr1')}__** da tarde` : `**__${dbc.get('autolock.hr1')}__** da noite`}.\n- Abre às ${dbc.get('autolock.hr2').split(':')[0] < 12 ? `**__${dbc.get('autolock.hr2')}__** da manhã` : dbc.get('autolock.hr2').split(':')[0] >= 12 && dbc.get('autolock.hr2').split(':')[0] < 18 ? `**__${dbc.get('autolock.hr2')}__** da tarde` : `**__${dbc.get('autolock.hr2')}__** da noite`}.`, inline: false }
            )

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`autolock.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_autolock_sistema`)
                .setLabel(`Sistema ${dbc.get(`autolock.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`autolock.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autolock_canal`)
                .setLabel(`Alterar Canais`)
                .setEmoji(dbep.get(`30`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autolock_horarios`)
                .setLabel(`Alterar Horários`)
                .setEmoji(dbep.get(`42`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_mod_autolock_horarios") {
            const modal = new ModalBuilder()
            .setTitle("Definindo horários")
            .setCustomId(`modal_config_mod_autolock_horarios`)

            const text = new TextInputBuilder()
            .setStyle(1)
            .setCustomId("text1")
            .setLabel(`Horário Lock (formato HH:MM)`)
            .setPlaceholder(`Ex: 21:32 (Hora e minuto)`)
            .setValue(dbc.get(`autolock.hr1`) || "")

            const text2 = new TextInputBuilder()
            .setStyle(1)
            .setCustomId("text2")
            .setLabel(`Horário UnLock (formato HH:MM)`)
            .setPlaceholder(`Ex: 08:12 (Hora e minuto)`)
            .setValue(dbc.get(`autolock.hr2`) || "")

            modal.addComponents(new ActionRowBuilder().addComponents(text))
            modal.addComponents(new ActionRowBuilder().addComponents(text2))

            interaction.showModal(modal)
        }
        if (interaction.isModalSubmit() && interaction.customId === "modal_config_mod_autolock_horarios") {
            const text1 = interaction.fields.getTextInputValue("text1")
            const text2 = interaction.fields.getTextInputValue("text2")

            if (!/^\d{1,2}:\d{2}$/.test(text1)) {
                interaction.reply({ content: `${dbe.get(`13`)} | Horário LOCK inválido!`, ephemeral:true})
                return;
            }
            if (!/^\d{1,2}:\d{2}$/.test(text2)) {
                interaction.reply({ content: `${dbe.get(`13`)} | Horário UNLOCK inválido!`, ephemeral:true})
                return;
            }
            dbc.set(`autolock.hr1`, text1)
            dbc.set(`autolock.hr2`, text2)

            let canais = ''
            const channels = await dbc.get(`autolock.canais`) || []
            await channels.map(async(entry) => {canais += `- <#${entry}>\n`;})
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Auto Lock", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- O Auto Lock fecha o chat automaticamente em um horário definido, apagando todas as mensagens para garantir privacidade e segurança.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`autolock.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:true },
                { name: `Canais:`, value: `${canais || "Nenhum canal definido."}`, inline:true, },
                { name: `Horários Lock/UnLock:`, value: `- Fecha às ${dbc.get('autolock.hr1').split(':')[0] < 12 ? `**__${dbc.get('autolock.hr1')}__** da manhã` : dbc.get('autolock.hr1').split(':')[0] >= 12 && dbc.get('autolock.hr1').split(':')[0] < 18 ? `**__${dbc.get('autolock.hr1')}__** da tarde` : `**__${dbc.get('autolock.hr1')}__** da noite`}.\n- Abre às ${dbc.get('autolock.hr2').split(':')[0] < 12 ? `**__${dbc.get('autolock.hr2')}__** da manhã` : dbc.get('autolock.hr2').split(':')[0] >= 12 && dbc.get('autolock.hr2').split(':')[0] < 18 ? `**__${dbc.get('autolock.hr2')}__** da tarde` : `**__${dbc.get('autolock.hr2')}__** da noite`}.`, inline: false }
            )

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`autolock.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_autolock_sistema`)
                .setLabel(`Sistema ${dbc.get(`autolock.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`autolock.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autolock_canal`)
                .setLabel(`Alterar Canais`)
                .setEmoji(dbep.get(`30`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autolock_horarios`)
                .setLabel(`Alterar Horários`)
                .setEmoji(dbep.get(`42`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
            interaction.followUp({ ephemeral:true, content: `${dbe.get(`6`)} | Horários modificados com sucesso!`})
        }
        if (interaction.customId === "config_mod_autolock_sistema") {
            dbc.get(`autolock.sistema`) === "ON" ? dbc.set(`autolock.sistema`, "OFF") : dbc.set(`autolock.sistema`, "ON")
            let canais = "" 
            const channels = await dbc.get(`autolock.canais`) || []
            await channels.map(async(entry) => {canais += `- <#${entry}>\n`;})
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Auto Lock", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- O Auto Lock fecha o chat automaticamente em um horário definido, apagando todas as mensagens para garantir privacidade e segurança.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`autolock.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:true },
                { name: `Canais:`, value: `${canais || "Nenhum canal definido."}`, inline:true, },
                { name: `Horários Lock/UnLock:`, value: `- Fecha às ${dbc.get('autolock.hr1').split(':')[0] < 12 ? `**__${dbc.get('autolock.hr1')}__** da manhã` : dbc.get('autolock.hr1').split(':')[0] >= 12 && dbc.get('autolock.hr1').split(':')[0] < 18 ? `**__${dbc.get('autolock.hr1')}__** da tarde` : `**__${dbc.get('autolock.hr1')}__** da noite`}.\n- Abre às ${dbc.get('autolock.hr2').split(':')[0] < 12 ? `**__${dbc.get('autolock.hr2')}__** da manhã` : dbc.get('autolock.hr2').split(':')[0] >= 12 && dbc.get('autolock.hr2').split(':')[0] < 18 ? `**__${dbc.get('autolock.hr2')}__** da tarde` : `**__${dbc.get('autolock.hr2')}__** da noite`}.`, inline: false }
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`autolock.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_autolock_sistema`)
                .setLabel(`Sistema ${dbc.get(`autolock.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`autolock.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autolock_canal`)
                .setLabel(`Alterar Canais`)
                .setEmoji(dbep.get(`30`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autolock_horarios`)
                .setLabel(`Alterar Horários`)
                .setEmoji(dbep.get(`42`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_mod_autolock_canal") {
            const select = new ActionRowBuilder()
            .addComponents(
                new Discord.ChannelSelectMenuBuilder()
                .setChannelTypes(Discord.ChannelType.GuildText)
                .setCustomId(`config_mod_autolock_canal_channels`)
                .setMaxValues(20)
                .setPlaceholder(`Selecione alguns canais.`),
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(4)
                .setCustomId("config_mod_autolock_canal_channels_reset")
                .setLabel(`Resetar Canais`)
                .setEmoji(dbep.get(`6`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod_autolock`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            interaction.update({ embeds: [
                new EmbedBuilder()
                .setAuthor({ name: `Configurando Canais Auto Lock`, iconURL: interaction.guild.iconURL({ dynamic: true})})
                .setDescription(`Selecione os canais para que a função de auto lock será aplicada.`)
                .setColor(dbc.get(`color`) || "Default")
            ], components: [select, row]})  
        }
        if (interaction.customId === "config_mod_autolock_canal_channels_reset") {
            dbc.set(`autolock.canais`, [])
            let canais = "" 
            const channels = await dbc.get(`autolock.canais`) || []
            await channels.map(async(entry) => {canais += `- <#${entry}>\n`;})
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Auto Lock", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- O Auto Lock fecha o chat automaticamente em um horário definido, apagando todas as mensagens para garantir privacidade e segurança.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`autolock.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:true },
                { name: `Canais:`, value: `${canais || "Nenhum canal definido."}`, inline:true, },
                { name: `Horários Lock/UnLock:`, value: `- Fecha às ${dbc.get('autolock.hr1').split(':')[0] < 12 ? `**__${dbc.get('autolock.hr1')}__** da manhã` : dbc.get('autolock.hr1').split(':')[0] >= 12 && dbc.get('autolock.hr1').split(':')[0] < 18 ? `**__${dbc.get('autolock.hr1')}__** da tarde` : `**__${dbc.get('autolock.hr1')}__** da noite`}.\n- Abre às ${dbc.get('autolock.hr2').split(':')[0] < 12 ? `**__${dbc.get('autolock.hr2')}__** da manhã` : dbc.get('autolock.hr2').split(':')[0] >= 12 && dbc.get('autolock.hr2').split(':')[0] < 18 ? `**__${dbc.get('autolock.hr2')}__** da tarde` : `**__${dbc.get('autolock.hr2')}__** da noite`}.`, inline: false }
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`autolock.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_autolock_sistema`)
                .setLabel(`Sistema ${dbc.get(`autolock.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`autolock.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autolock_canal`)
                .setLabel(`Alterar Canais`)
                .setEmoji(dbep.get(`30`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autolock_horarios`)
                .setLabel(`Alterar Horários`)
                .setEmoji(dbep.get(`42`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
            interaction.followUp({ ephemeral:true, content: `${dbe.get(`6`)} | Canais resetados com sucesso!`})
        }
        if (interaction.isChannelSelectMenu() && interaction.customId === "config_mod_autolock_canal_channels") {
            const canaiss = interaction.values;

            dbc.set(`autolock.canais`, canaiss)

            let canais = "" 
            const channels = await dbc.get(`autolock.canais`) || []
            await channels.map(async(entry) => {canais += `- <#${entry}>\n`;})
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Auto Lock", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- O Auto Lock fecha o chat automaticamente em um horário definido, apagando todas as mensagens para garantir privacidade e segurança.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            .addFields(
                { name: `Sistema:`, value: `${dbc.get(`autolock.sistema`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:true },
                { name: `Canais:`, value: `${canais || "Nenhum canal definido."}`, inline:true, },
                { name: `Horários Lock/UnLock:`, value: `- Fecha às ${dbc.get('autolock.hr1').split(':')[0] < 12 ? `**__${dbc.get('autolock.hr1')}__** da manhã` : dbc.get('autolock.hr1').split(':')[0] >= 12 && dbc.get('autolock.hr1').split(':')[0] < 18 ? `**__${dbc.get('autolock.hr1')}__** da tarde` : `**__${dbc.get('autolock.hr1')}__** da noite`}.\n- Abre às ${dbc.get('autolock.hr2').split(':')[0] < 12 ? `**__${dbc.get('autolock.hr2')}__** da manhã` : dbc.get('autolock.hr2').split(':')[0] >= 12 && dbc.get('autolock.hr2').split(':')[0] < 18 ? `**__${dbc.get('autolock.hr2')}__** da tarde` : `**__${dbc.get('autolock.hr2')}__** da noite`}.`, inline: false }
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`autolock.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_mod_autolock_sistema`)
                .setLabel(`Sistema ${dbc.get(`autolock.sistema`) === "ON" ? "Ligado" : "Desligado"}`)
                .setEmoji(dbc.get(`autolock.sistema`) === "ON" ? dbep.get(`4`) : dbep.get(`2`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autolock_canal`)
                .setLabel(`Alterar Canais`)
                .setEmoji(dbep.get(`30`)),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_mod_autolock_horarios`)
                .setLabel(`Alterar Horários`)
                .setEmoji(dbep.get(`42`)),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod`)
                .setLabel(`Voltar`)
                .setEmoji(dbep.get(`29`)),
            )
            await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
            interaction.followUp({ ephemeral:true, content: `${dbe.get(`6`)} | Canais alterado com sucesso!`})
        }
        if (interaction.customId === "config_mod_sugest") {
            let sistema = "\`🔴 Desligado\`"
            if (dbc.get(`sugest.sistema`) === "ON") {
                sistema = "\`🟢 Ligado\`"
            }
            const channel = interaction.guild.channels.cache.get(dbc.get(`sugest.channel`))
            const embed = new EmbedBuilder()
            .setColor(dbc.get(`color`) || "Default")
            .setAuthor({ name: `Configurando Sistema Sugestão`, iconURL: interaction.guild.iconURL({ dynamic: true})})
            .addFields(
                {
                    name: `Sistema Sugestão:`,
                    value: `${sistema}`,
                    inline:true
                },
                {
                    name: `Emojis Atuais:`,
                    value: `- Emoji Concordo: ${dbc.get(`sugest.certo`)}.\n- Emoji Discordo: ${dbc.get(`sugest.errado`)}.`,
                    inline:true
                },
                {
                    name: `Atual Canal de Sugestão:`,
                    value: `${channel || "`Não Definido`"}`
                }
            )
            .setTimestamp()

            let emjon = dbep.get(`4`)
            let emjoff = dbep.get(`2`)
            let emjpas = dbep.get(`30`)
            let emjvol = dbep.get(`29`)

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle(dbc.get(`sugest.sistema`) === "ON" ? 3 : 4)
                    .setCustomId(`sugestonoff`)
                    .setLabel("Sistema")
                    .setEmoji(dbc.get(`sugest.sistema`) === "ON" ? emjon : emjoff),
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`sugestmudaemojicerto`)
                    .setLabel(`Mudar Emoji Concordo`),
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`sugestmudaemojidiscordo`)
                    .setLabel(`Mudar Emoji Discordo`),
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`sugestmudachannel`)
                    .setLabel(`Mudar Canal`)
                    .setEmoji(emjpas),
                new ButtonBuilder()
                    .setStyle(1)
                    .setCustomId(`config_voltar`)
                    .setLabel(`Voltar`)
                    .setEmoji(emjvol)
            )

            interaction.update({ embeds: [embed], components: [row]})
        }

        if (interaction.customId === "sugestonoff") {
            if (dbc.get(`sugest.sistema`) === "ON") {
                dbc.set(`sugest.sistema`, "OFF")
            } else {
                dbc.set(`sugest.sistema`, "ON")
            }
            let sistema = "\`🔴 Desligado\`"
            if (dbc.get(`sugest.sistema`) === "ON") {
                sistema = "\`🟢 Ligado\`"
            }
            const channel = interaction.guild.channels.cache.get(dbc.get(`sugest.channel`))
            const embed = new EmbedBuilder()
            .setColor(dbc.get(`color`) || "Default")
            .setAuthor({ name: `Configurando Sistema Sugestão`, iconURL: interaction.guild.iconURL({ dynamic: true})})
            .addFields(
                {
                    name: `Sistema Sugestão:`,
                    value: `${sistema}`,
                    inline:true
                },
                {
                    name: `Emojis Atuais:`,
                    value: `- Emoji Concordo: ${dbc.get(`sugest.certo`)}.\n- Emoji Discordo: ${dbc.get(`sugest.errado`)}.`,
                    inline:true
                },
                {
                    name: `Atual Canal de Sugestão:`,
                    value: `${channel || "`Não Definido`"}`
                }
            )
            .setTimestamp()

            let emjon = dbep.get(`4`)
            let emjoff = dbep.get(`2`)
            let emjpas = dbep.get(`30`)
            let emjvol = dbep.get(`29`)

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle(dbc.get(`sugest.sistema`) === "ON" ? 3 : 4)
                    .setCustomId(`sugestonoff`)
                    .setLabel("Sistema")
                    .setEmoji(dbc.get(`sugest.sistema`) === "ON" ? emjon : emjoff),
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`sugestmudaemojicerto`)
                    .setLabel(`Mudar Emoji Concordo`),
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`sugestmudaemojidiscordo`)
                    .setLabel(`Mudar Emoji Discordo`),
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`sugestmudachannel`)
                    .setLabel(`Mudar Canal`)
                    .setEmoji(emjpas),
                new ButtonBuilder()
                    .setStyle(1)
                    .setCustomId(`config_voltar`)
                    .setLabel(`Voltar`)
                    .setEmoji(emjvol)
            )

            interaction.update({ embeds: [embed], components: [row]})
        }
        if (interaction.customId === "sugestmudachannel") {
            const select = new ActionRowBuilder()
            .addComponents(
                new Discord.ChannelSelectMenuBuilder()
                .setChannelTypes(Discord.ChannelType.GuildText)
                .setCustomId(`channel_select_sugest`)
                .setMaxValues(1)
                .setPlaceholder(`Selecione um canal...`),
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_mod_sugest`)
                .setEmoji(dbep.get(`29`))
            )
            interaction.update({ embeds: [
                new EmbedBuilder()
                .setAuthor({ name: `Configurando Sistema Sugestão`, iconURL: interaction.guild.iconURL({ dynamic: true})})
                .setDescription(`Selecione o canal que será definido como o canal de sugestão.`)
                .setColor(dbc.get(`color`) || "Default")
            ], components: [select, row]})
        }
        if (interaction.isChannelSelectMenu() && interaction.customId === "channel_select_sugest") {
            const cargos = interaction.values
            cargos.map(async(cargos) => { 
                dbc.set(`sugest.channel`, cargos)
                let sistema = "\`🔴 Desligado\`"
                if (dbc.get(`sugest.sistema`) === "ON") {
                    sistema = "\`🟢 Ligado\`"
                }
                const channel = interaction.guild.channels.cache.get(dbc.get(`sugest.channel`))
                const embed = new EmbedBuilder()
                .setColor(dbc.get(`color`) || "Default")
                .setAuthor({ name: `Configurando Sistema Sugestão`, iconURL: interaction.guild.iconURL({ dynamic: true})})
                .addFields(
                    {
                        name: `Sistema Sugestão:`,
                        value: `${sistema}`,
                        inline:true
                    },
                    {
                        name: `Emojis Atuais:`,
                        value: `- Emoji Concordo: ${dbc.get(`sugest.certo`)}. \n- Emoji Discordo: ${dbc.get(`sugest.errado`)}.`,
                        inline:true
                    },
                    {
                        name: `Atual Canal de Sugestão:`,
                        value: `${channel || "`Não Definido`"}`
                    }
                )
                .setTimestamp()
    
                let emjon = dbep.get(`4`)
                let emjoff = dbep.get(`2`)
                let emjpas = dbep.get(`30`)
                let emjvol = dbep.get(`29`)
    
                const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setStyle(dbc.get(`sugest.sistema`) === "ON" ? 3 : 4)
                        .setCustomId(`sugestonoff`)
                        .setLabel("Sistema")
                        .setEmoji(dbc.get(`sugest.sistema`) === "ON" ? emjon : emjoff),
                    new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId(`sugestmudaemojicerto`)
                        .setLabel(`Mudar Emoji Concordo`),
                    new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId(`sugestmudaemojidiscordo`)
                        .setLabel(`Mudar Emoji Discordo`),
                    new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId(`sugestmudachannel`)
                        .setLabel(`Mudar Canal`)
                        .setEmoji(emjpas),
                    new ButtonBuilder()
                        .setStyle(1)
                        .setCustomId(`config_voltar`)
                        .setLabel(`Voltar`)
                        .setEmoji(emjvol)
                )
    
                interaction.update({ embeds: [embed], components: [row]})
            })
        }
        if (interaction.customId === "sugestmudaemojidiscordo") {
            const modal = new ModalBuilder()
            .setCustomId(`modal_sugestmudaemojidiscordo`)
            .setTitle(`Mudar Emoji Discordo`)
            .addComponents(
                new ActionRowBuilder()
                .addComponents(
                    new TextInputBuilder()
                    .setStyle(1)
                    .setCustomId(`text`)
                    .setLabel(`Emoji`)
                    .setPlaceholder(`Escreva o emoji aqui.`)
                )
            )
            interaction.showModal(modal)
        }
        if (interaction.customId === "sugestmudaemojicerto") {
            const modal = new ModalBuilder()
            .setCustomId(`modal_sugestmudaemojicerto`)
            .setTitle(`Mudar Emoji Concordo`)
            .addComponents(
                new ActionRowBuilder()
                .addComponents(
                    new TextInputBuilder()
                    .setStyle(1)
                    .setCustomId(`text`)
                    .setLabel(`Emoji`)
                    .setPlaceholder(`Escreva o emoji aqui.`)
                )
            )
            interaction.showModal(modal)
        }
        if (interaction.isModalSubmit() && interaction.customId === "modal_sugestmudaemojicerto") {
            const text = interaction.fields.getTextInputValue("text")
            const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
            const msg = await interaction.update({ content: `${dbe.get(`16`)} | Aguarde...`})
            if (emojiRegex.test(text)) {
                dbc.set(`sugest.certo`, text)
                interaction.followUp({content: `${dbe.get(`6`)} | Emoji trocado com sucesso!`, ephemeral:true})
            } else if (text.startsWith("<")) {
                dbc.set(`sugest.certo`, text)
                msg.followUp({content: `${dbe.get(`6`)} | Emoji trocado com sucesso!`, ephemeral:true })
            } else {
                msg.followUp({content: `${dbe.get(`13`)} | Mande um emoji válido!`, ephemeral:true})
            }
            let sistema = "\`🔴 Desligado\`"
            if (dbc.get(`sugest.sistema`) === "ON") {
                sistema = "\`🟢 Ligado\`"
            }
            const channel = interaction.guild.channels.cache.get(dbc.get(`sugest.channel`))
            const embed = new EmbedBuilder()
            .setColor(dbc.get(`color`) || "Default")
            .setAuthor({ name: `Configurando Sistema Sugestão`, iconURL: interaction.guild.iconURL({ dynamic: true})})
            .addFields(
                {
                    name: `Sistema Sugestão:`,
                    value: `${sistema}`,
                    inline:true
                },
                {
                    name: `Emojis Atuais:`,
                    value: `- Emoji Concordo: ${dbc.get(`sugest.certo`)}. \n- Emoji Discordo: ${dbc.get(`sugest.errado`)}.`,
                    inline:true
                },
                {
                    name: `Atual Canal de Sugestão:`,
                    value: `${channel || "`Não Definido`"}`
                }
            )
            .setTimestamp()

            let emjon = dbep.get(`4`)
            let emjoff = dbep.get(`2`)
            let emjpas = dbep.get(`30`)
            let emjvol = dbep.get(`29`)

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle(dbc.get(`sugest.sistema`) === "ON" ? 3 : 4)
                    .setCustomId(`sugestonoff`)
                    .setLabel("Sistema")
                    .setEmoji(dbc.get(`sugest.sistema`) === "ON" ? emjon : emjoff),
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`sugestmudaemojicerto`)
                    .setLabel(`Mudar Emoji Concordo`),
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`sugestmudaemojidiscordo`)
                    .setLabel(`Mudar Emoji Discordo`),
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`sugestmudachannel`)
                    .setLabel(`Mudar Canal`)
                    .setEmoji(emjpas),
                new ButtonBuilder()
                    .setStyle(1)
                    .setCustomId(`config_voltar`)
                    .setLabel(`Voltar`)
                    .setEmoji(emjvol)
            )

            msg.edit({ embeds: [embed], components: [row], content: ""})
        }
        if (interaction.isModalSubmit() && interaction.customId === "modal_sugestmudaemojidiscordo") {
            const text = interaction.fields.getTextInputValue("text")
            const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
            const msg = await interaction.update({ content: `${dbe.get(`16`)} | Aguarde...`})
            if (emojiRegex.test(text)) {
                dbc.set(`sugest.errado`, text)
                interaction.followUp({content: `${dbe.get(`6`)} | Emoji trocado com sucesso!`, ephemeral:true})
            } else if (text.startsWith("<")) {
                dbc.set(`sugest.errado`, text)
                msg.followUp({content: `${dbe.get(`6`)} | Emoji trocado com sucesso!`, ephemeral:true })
            } else {
                msg.followUp({content: `${dbe.get(`13`)} | Mande um emoji válido!`, ephemeral:true})
            }
            let sistema = "\`🔴 Desligado\`"
            if (dbc.get(`sugest.sistema`) === "ON") {
                sistema = "\`🟢 Ligado\`"
            }
            const channel = interaction.guild.channels.cache.get(dbc.get(`sugest.channel`))
            const embed = new EmbedBuilder()
            .setColor(dbc.get(`color`) || "Default")
            .setAuthor({ name: `Configurando Sistema Sugestão`, iconURL: interaction.guild.iconURL({ dynamic: true})})
            .addFields(
                {
                    name: `Sistema Sugestão:`,
                    value: `${sistema}`,
                    inline:true
                },
                {
                    name: `Emojis Atuais:`,
                    value: `- Emoji Concordo: ${dbc.get(`sugest.certo`)}. \n- Emoji Discordo: ${dbc.get(`sugest.errado`)}.`,
                    inline:true
                },
                {
                    name: `Atual Canal de Sugestão:`,
                    value: `${channel || "`Não Definido`"}`
                }
            )
            .setTimestamp()

            let emjon = dbep.get(`4`)
            let emjoff = dbep.get(`2`)
            let emjpas = dbep.get(`30`)
            let emjvol = dbep.get(`29`)

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle(dbc.get(`sugest.sistema`) === "ON" ? 3 : 4)
                    .setCustomId(`sugestonoff`)
                    .setLabel("Sistema")
                    .setEmoji(dbc.get(`sugest.sistema`) === "ON" ? emjon : emjoff),
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`sugestmudaemojicerto`)
                    .setLabel(`Mudar Emoji Concordo`),
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`sugestmudaemojidiscordo`)
                    .setLabel(`Mudar Emoji Discordo`),
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`sugestmudachannel`)
                    .setLabel(`Mudar Canal`)
                    .setEmoji(emjpas),
                new ButtonBuilder()
                    .setStyle(1)
                    .setCustomId(`config_voltar`)
                    .setLabel(`Voltar`)
                    .setEmoji(emjvol)
            )

            msg.edit({ embeds: [embed], components: [row], content: ""})
        }

        if (interaction.customId === "config_pagamentos_canais") {
            let canal_publicv = interaction.guild.channels.cache.get(dbc.get(`canais.vendas_public`))
            let canal_privv = interaction.guild.channels.cache.get(dbc.get(`canais.vendas_privado`))
            let feedback = interaction.guild.channels.cache.get(dbc.get(`canais.feedback`))
            let cargoCliente = interaction.guild.roles.cache.get(dbc.get(`canais.cargo_cliente`))
            let cargoStaff = interaction.guild.roles.cache.get(dbc.get(`canais.cargo_staff`))

            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Canais", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure os canais de vendas do seu bot.`)
            .addFields(
                {
                    name: `Sistema Logs Carrinho:`,
                    value: dbc.get(`canais.sistema_carrinho`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`",
                    inline:true
                },
                {
                    name: `Canal Vendas Privado:`,
                    value: `${canal_privv || "Não Definido"}`,
                    inline:true
                },
                {
                    name: `Canal Vendas Públicas:`,
                    value: `${canal_publicv || "Não Definido"}`,
                    inline:true
                },
                {
                    name: `Canal FeedBacks:`,
                    value: `${feedback || "Não Definido"}`,
                    inline:true
                },
                {
                    name: `Cargo Cliente:`,
                    value: `${cargoCliente || "Não Definido"}`,
                    inline:true
                },
                {
                    name: `Cargo Staff:`,
                    value: `${cargoStaff || "Não Definido"}`,
                    inline:true
                },
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            let emjon = dbep.get(`4`)
            let emjoff = dbep.get(`2`)
            let emjvol = dbep.get(`29`)
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`canais.sistema_carrinho`) === "ON" ? 3 : 4)
                .setCustomId(`config_pagamentos_canais_sistemacarrinho`)
                .setLabel("Sistema Logs Carrinho")
                .setEmoji(dbc.get(`canais.sistema_carrinho`) === "ON" ? emjon : emjoff),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_canais_priv`)
                .setLabel(`Canal Vendas Privada`),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_canais_public`)
                .setLabel(`Canal Vendas Publicas`),
            )
            const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_canais_feedback`)
                .setLabel(`Canal FeedBacks`),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_canais_cargocliente`)
                .setLabel(`Cargo Cliente`),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_canais_cargostaff`)
                .setLabel(`Cargo Staff`),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol),
            )
            await interaction.update({ embeds: [embed], components: [row, row2], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_pagamentos_canais_sistemacarrinho") {
            if (dbc.get(`canais.sistema_carrinho`) === "ON" ) {
                dbc.set(`canais.sistema_carrinho`, "OFF") 
            } else {
                dbc.set(`canais.sistema_carrinho`, "ON") 
            }
            let canal_publicv = interaction.guild.channels.cache.get(dbc.get(`canais.vendas_public`))
            let canal_privv = interaction.guild.channels.cache.get(dbc.get(`canais.vendas_privado`))
            let feedback = interaction.guild.channels.cache.get(dbc.get(`canais.feedback`))
            let cargoCliente = interaction.guild.roles.cache.get(dbc.get(`canais.cargo_cliente`))
            let cargoStaff = interaction.guild.roles.cache.get(dbc.get(`canais.cargo_staff`))

            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Canais", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure os canais de vendas do seu bot.`)
            .addFields(
                {
                    name: `Sistema Logs Carrinho:`,
                    value: dbc.get(`canais.sistema_carrinho`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`",
                    inline:true
                },
                {
                    name: `Canal Vendas Privado:`,
                    value: `${canal_privv || "Não Definido"}`,
                    inline:true
                },
                {
                    name: `Canal Vendas Públicas:`,
                    value: `${canal_publicv || "Não Definido"}`,
                    inline:true
                },
                {
                    name: `Canal FeedBacks:`,
                    value: `${feedback || "Não Definido"}`,
                    inline:true
                },
                {
                    name: `Cargo Cliente:`,
                    value: `${cargoCliente || "Não Definido"}`,
                    inline:true
                },
                {
                    name: `Cargo Staff:`,
                    value: `${cargoStaff || "Não Definido"}`,
                    inline:true
                },
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            let emjon = dbep.get(`4`)
            let emjoff = dbep.get(`2`)
            let emjvol = dbep.get(`29`)
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`canais.sistema_carrinho`) === "ON" ? 3 : 4)
                .setCustomId(`config_pagamentos_canais_sistemacarrinho`)
                .setLabel("Sistema Logs Carrinho")
                .setEmoji(dbc.get(`canais.sistema_carrinho`) === "ON" ? emjon : emjoff),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_canais_priv`)
                .setLabel(`Canal Vendas Privada`),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_canais_public`)
                .setLabel(`Canal Vendas Publicas`),
            )
            const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_canais_feedback`)
                .setLabel(`Canal FeedBacks`),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_canais_cargocliente`)
                .setLabel(`Cargo Cliente`),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_canais_cargostaff`)
                .setLabel(`Cargo Staff`),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol),
            )
            await interaction.update({ embeds: [embed], components: [row, row2], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_pagamentos_canais_feedback") {
            const select = new ActionRowBuilder()
            .addComponents(
                new Discord.ChannelSelectMenuBuilder()
                .setChannelTypes(Discord.ChannelType.GuildText)
                .setCustomId(`channel_config_pagamentos_canais_feedback`)
                .setMaxValues(1)
                .setPlaceholder(`Selecione um canal...`),
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos_canais`)
                .setEmoji(dbep.get(`29`))
            )
            interaction.update({ embeds: [
                new EmbedBuilder()
                .setAuthor({ name: "Configurando Canais", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                .setColor(dbc.get("color"))
                .setDescription(`Olá ${interaction.user} 👋.\n- Selecione o canal que será definido como canal de feedbacks. Será um canal que após alguém fizer alguma compra o bot marcará o cliente no canal de feedbacks para fazer uma avaliação do produto comprado.`)
            ], components: [select, row]})
        }
        if (interaction.customId === "config_pagamentos_canais_public") {
            const select = new ActionRowBuilder()
            .addComponents(
                new Discord.ChannelSelectMenuBuilder()
                .setChannelTypes(Discord.ChannelType.GuildText)
                .setCustomId(`channel_config_pagamentos_canais_public`)
                .setMaxValues(1)
                .setPlaceholder(`Selecione um canal...`),
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos_canais`)
                .setEmoji(dbep.get(`29`))
            )
            interaction.update({ embeds: [
                new EmbedBuilder()
                .setAuthor({ name: "Configurando Canais", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                .setColor(dbc.get("color"))
                .setDescription(`Olá ${interaction.user} 👋.\n- Selecione o canal que será definido como canal vendas públicas. Ele ficará visível para todos verem as suas vendas.`)
            ], components: [select, row]})
        }
        if (interaction.customId === "config_pagamentos_canais_priv") {
            const select = new ActionRowBuilder()
            .addComponents(
                new Discord.ChannelSelectMenuBuilder()
                .setChannelTypes(Discord.ChannelType.GuildText)
                .setCustomId(`channel_config_pagamentos_canais_priv`)
                .setMaxValues(1)
                .setPlaceholder(`Selecione um canal...`),
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos_canais`)
                .setEmoji(dbep.get(`29`))
            )
            interaction.update({ embeds: [
                new EmbedBuilder()
                .setAuthor({ name: "Configurando Canais", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                .setColor(dbc.get("color"))
                .setDescription(`Olá ${interaction.user} 👋.\n- Selecione o canal que será definido como canal vendas privada. É importante que você selecione um canal privado, pois algumas informações do produto vendido serão informadas.`)
            ], components: [select, row]})
        }
        if (interaction.customId === "config_pagamentos_canais_cargocliente") {
            const select = new ActionRowBuilder()
            .addComponents(
                new Discord.RoleSelectMenuBuilder()
                .setCustomId(`channel_config_pagamentos_canais_cargocliente`)
                .setMaxValues(1)
                .setPlaceholder(`Selecione um cargo...`),
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos_canais`)
                .setEmoji(dbep.get(`29`))
            )
            interaction.update({ embeds: [
                new EmbedBuilder()
                .setAuthor({ name: "Configurando Canais", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                .setColor(dbc.get("color"))
                .setDescription(`Olá ${interaction.user} 👋.\n- Selecione o cargo que será dado após alguém fazer uma compra no seu bot.`)
            ], components: [select, row]})
        }
        if (interaction.customId === "config_pagamentos_canais_cargostaff") {
            const select = new ActionRowBuilder()
            .addComponents(
                new Discord.RoleSelectMenuBuilder()
                .setCustomId(`channel_config_pagamentos_canais_cargostaff`)
                .setMaxValues(1)
                .setPlaceholder(`Selecione um cargo...`),
            )
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos_canais`)
                .setEmoji(dbep.get(`29`))
            )
            interaction.update({ embeds: [
                new EmbedBuilder()
                .setAuthor({ name: "Configurando Canais", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                .setColor(dbc.get("color"))
                .setDescription(`Olá ${interaction.user} 👋.\n- Selecione o cargo que poderá aprovar os pagamentos e será marcado em informações importantes.`)
            ], components: [select, row]})
        }
        if (interaction.isChannelSelectMenu()) {
            const option = interaction.customId;

            if (option === "channel_config_pagamentos_canais_public") {
                const channel = interaction.values[0]
                dbc.set(`canais.vendas_public`, channel)
            
                let canal_publicv = interaction.guild.channels.cache.get(dbc.get(`canais.vendas_public`))
                let canal_privv = interaction.guild.channels.cache.get(dbc.get(`canais.vendas_privado`))
                let feedback = interaction.guild.channels.cache.get(dbc.get(`canais.feedback`))
                let cargoCliente = interaction.guild.roles.cache.get(dbc.get(`canais.cargo_cliente`))
                let cargoStaff = interaction.guild.roles.cache.get(dbc.get(`canais.cargo_staff`))

                const embed = new EmbedBuilder()
                .setAuthor({ name: "Configurando Canais", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                .setColor(dbc.get("color"))
                .setDescription(`Olá ${interaction.user} 👋.\n- Configure os canais de vendas do seu bot.`)
                .addFields(
                    {
                        name: `Sistema Logs Carrinho:`,
                        value: dbc.get(`canais.sistema_carrinho`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`",
                        inline:true
                    },
                    {
                        name: `Canal Vendas Privado:`,
                        value: `${canal_privv || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Canal Vendas Públicas:`,
                        value: `${canal_publicv || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Canal FeedBacks:`,
                        value: `${feedback || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Cargo Cliente:`,
                        value: `${cargoCliente || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Cargo Staff:`,
                        value: `${cargoStaff || "Não Definido"}`,
                        inline:true
                    },
                )
                .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
                let emjon = dbep.get(`4`)
                let emjoff = dbep.get(`2`)
                let emjvol = dbep.get(`29`)
                const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setStyle(dbc.get(`canais.sistema_carrinho`) === "ON" ? 3 : 4)
                    .setCustomId(`config_pagamentos_canais_sistemacarrinho`)
                    .setLabel("Sistema Logs Carrinho")
                    .setEmoji(dbc.get(`canais.sistema_carrinho`) === "ON" ? emjon : emjoff),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_priv`)
                    .setLabel(`Canal Vendas Privada`),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_public`)
                    .setLabel(`Canal Vendas Publicas`),
                )
                const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_feedback`)
                    .setLabel(`Canal FeedBacks`),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_cargocliente`)
                    .setLabel(`Cargo Cliente`),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_cargostaff`)
                    .setLabel(`Cargo Staff`),
                    new ButtonBuilder()
                    .setStyle(1)
                    .setCustomId(`config_pagamentos`)
                    .setLabel(`Voltar`)
                    .setEmoji(emjvol),
                )
                await interaction.update({ embeds: [embed], components: [row, row2], content: "", ephemeral:true})
                interaction.followUp({ content: `${dbe.get(`6`)} | Alterado! Novo canal é ${canal_publicv}.`, ephemeral:true})
            }
            if (option === "channel_config_pagamentos_canais_priv") {
                const channel = interaction.values[0]
                dbc.set(`canais.vendas_privado`, channel)
            
                let canal_publicv = interaction.guild.channels.cache.get(dbc.get(`canais.vendas_public`))
                let canal_privv = interaction.guild.channels.cache.get(dbc.get(`canais.vendas_privado`))
                let feedback = interaction.guild.channels.cache.get(dbc.get(`canais.feedback`))
                let cargoCliente = interaction.guild.roles.cache.get(dbc.get(`canais.cargo_cliente`))
                let cargoStaff = interaction.guild.roles.cache.get(dbc.get(`canais.cargo_staff`))

                const embed = new EmbedBuilder()
                .setAuthor({ name: "Configurando Canais", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                .setColor(dbc.get("color"))
                .setDescription(`Olá ${interaction.user} 👋.\n- Configure os canais de vendas do seu bot.`)
                .addFields(
                    {
                        name: `Sistema Logs Carrinho:`,
                        value: dbc.get(`canais.sistema_carrinho`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`",
                        inline:true
                    },
                    {
                        name: `Canal Vendas Privado:`,
                        value: `${canal_privv || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Canal Vendas Públicas:`,
                        value: `${canal_publicv || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Canal FeedBacks:`,
                        value: `${feedback || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Cargo Cliente:`,
                        value: `${cargoCliente || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Cargo Staff:`,
                        value: `${cargoStaff || "Não Definido"}`,
                        inline:true
                    },
                )
                .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
                let emjon = dbep.get(`4`)
                let emjoff = dbep.get(`2`)
                let emjvol = dbep.get(`29`)
                const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setStyle(dbc.get(`canais.sistema_carrinho`) === "ON" ? 3 : 4)
                    .setCustomId(`config_pagamentos_canais_sistemacarrinho`)
                    .setLabel("Sistema Logs Carrinho")
                    .setEmoji(dbc.get(`canais.sistema_carrinho`) === "ON" ? emjon : emjoff),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_priv`)
                    .setLabel(`Canal Vendas Privada`),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_public`)
                    .setLabel(`Canal Vendas Publicas`),
                )
                const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_feedback`)
                    .setLabel(`Canal FeedBacks`),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_cargocliente`)
                    .setLabel(`Cargo Cliente`),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_cargostaff`)
                    .setLabel(`Cargo Staff`),
                    new ButtonBuilder()
                    .setStyle(1)
                    .setCustomId(`config_pagamentos`)
                    .setLabel(`Voltar`)
                    .setEmoji(emjvol),
                )
                await interaction.update({ embeds: [embed], components: [row, row2], content: "", ephemeral:true})
                interaction.followUp({ content: `${dbe.get(`6`)} | Alterado! Novo canal é ${canal_privv}.`, ephemeral:true})
            }
            if (option === "channel_config_pagamentos_canais_feedback") {
                const channel = interaction.values[0]
                dbc.set(`canais.feedback`, channel)
            
                let canal_publicv = interaction.guild.channels.cache.get(dbc.get(`canais.vendas_public`))
                let canal_privv = interaction.guild.channels.cache.get(dbc.get(`canais.vendas_privado`))
                let feedback = interaction.guild.channels.cache.get(dbc.get(`canais.feedback`))
                let cargoCliente = interaction.guild.roles.cache.get(dbc.get(`canais.cargo_cliente`))
                let cargoStaff = interaction.guild.roles.cache.get(dbc.get(`canais.cargo_staff`))

                const embed = new EmbedBuilder()
                .setAuthor({ name: "Configurando Canais", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                .setColor(dbc.get("color"))
                .setDescription(`Olá ${interaction.user} 👋.\n- Configure os canais de vendas do seu bot.`)
                .addFields(
                    {
                        name: `Sistema Logs Carrinho:`,
                        value: dbc.get(`canais.sistema_carrinho`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`",
                        inline:true
                    },
                    {
                        name: `Canal Vendas Privado:`,
                        value: `${canal_privv || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Canal Vendas Públicas:`,
                        value: `${canal_publicv || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Canal FeedBacks:`,
                        value: `${feedback || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Cargo Cliente:`,
                        value: `${cargoCliente || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Cargo Staff:`,
                        value: `${cargoStaff || "Não Definido"}`,
                        inline:true
                    },
                )
                .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
                let emjon = dbep.get(`4`)
                let emjoff = dbep.get(`2`)
                let emjvol = dbep.get(`29`)
                const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setStyle(dbc.get(`canais.sistema_carrinho`) === "ON" ? 3 : 4)
                    .setCustomId(`config_pagamentos_canais_sistemacarrinho`)
                    .setLabel("Sistema Logs Carrinho")
                    .setEmoji(dbc.get(`canais.sistema_carrinho`) === "ON" ? emjon : emjoff),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_priv`)
                    .setLabel(`Canal Vendas Privada`),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_public`)
                    .setLabel(`Canal Vendas Publicas`),
                )
                const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_feedback`)
                    .setLabel(`Canal FeedBacks`),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_cargocliente`)
                    .setLabel(`Cargo Cliente`),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_cargostaff`)
                    .setLabel(`Cargo Staff`),
                    new ButtonBuilder()
                    .setStyle(1)
                    .setCustomId(`config_pagamentos`)
                    .setLabel(`Voltar`)
                    .setEmoji(emjvol),
                )
                await interaction.update({ embeds: [embed], components: [row, row2], content: "", ephemeral:true})
                interaction.followUp({ content: `${dbe.get(`6`)} | Alterado! Novo canal é ${feedback}.`, ephemeral:true})
            }
        }
        if (interaction.isRoleSelectMenu()) {
            const option = interaction.customId;

            if (option === "channel_config_pagamentos_canais_cargostaff") {
                const cargo = interaction.values[0]
                dbc.set(`canais.cargo_staff`, cargo)
            
                let canal_publicv = interaction.guild.channels.cache.get(dbc.get(`canais.vendas_public`))
                let canal_privv = interaction.guild.channels.cache.get(dbc.get(`canais.vendas_privado`))
                let feedback = interaction.guild.channels.cache.get(dbc.get(`canais.feedback`))
                let cargoCliente = interaction.guild.roles.cache.get(dbc.get(`canais.cargo_cliente`))
                let cargoStaff = interaction.guild.roles.cache.get(dbc.get(`canais.cargo_staff`))

                const embed = new EmbedBuilder()
                .setAuthor({ name: "Configurando Canais", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                .setColor(dbc.get("color"))
                .setDescription(`Olá ${interaction.user} 👋.\n- Configure os canais de vendas do seu bot.`)
                .addFields(
                    {
                        name: `Sistema Logs Carrinho:`,
                        value: dbc.get(`canais.sistema_carrinho`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`",
                        inline:true
                    },
                    {
                        name: `Canal Vendas Privado:`,
                        value: `${canal_privv || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Canal Vendas Públicas:`,
                        value: `${canal_publicv || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Canal FeedBacks:`,
                        value: `${feedback || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Cargo Cliente:`,
                        value: `${cargoCliente || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Cargo Staff:`,
                        value: `${cargoStaff || "Não Definido"}`,
                        inline:true
                    },
                )
                .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
                let emjon = dbep.get(`4`)
                let emjoff = dbep.get(`2`)
                let emjvol = dbep.get(`29`)
                const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setStyle(dbc.get(`canais.sistema_carrinho`) === "ON" ? 3 : 4)
                    .setCustomId(`config_pagamentos_canais_sistemacarrinho`)
                    .setLabel("Sistema Logs Carrinho")
                    .setEmoji(dbc.get(`canais.sistema_carrinho`) === "ON" ? emjon : emjoff),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_priv`)
                    .setLabel(`Canal Vendas Privada`),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_public`)
                    .setLabel(`Canal Vendas Publicas`),
                )
                const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_feedback`)
                    .setLabel(`Canal FeedBacks`),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_cargocliente`)
                    .setLabel(`Cargo Cliente`),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_cargostaff`)
                    .setLabel(`Cargo Staff`),
                    new ButtonBuilder()
                    .setStyle(1)
                    .setCustomId(`config_pagamentos`)
                    .setLabel(`Voltar`)
                    .setEmoji(emjvol),
                )
                await interaction.update({ embeds: [embed], components: [row, row2], content: "", ephemeral:true})
                interaction.followUp({ content: `${dbe.get(`6`)} | Alterado! Novo cargo staff é ${cargoStaff}.`, ephemeral:true})
            }

            if (option === "channel_config_pagamentos_canais_cargocliente") {
                const cargo = interaction.values[0]
                dbc.set(`canais.cargo_cliente`, cargo)
            
                let canal_publicv = interaction.guild.channels.cache.get(dbc.get(`canais.vendas_public`))
                let canal_privv = interaction.guild.channels.cache.get(dbc.get(`canais.vendas_privado`))
                let feedback = interaction.guild.channels.cache.get(dbc.get(`canais.feedback`))
                let cargoCliente = interaction.guild.roles.cache.get(dbc.get(`canais.cargo_cliente`))
                let cargoStaff = interaction.guild.roles.cache.get(dbc.get(`canais.cargo_staff`))

                const embed = new EmbedBuilder()
                .setAuthor({ name: "Configurando Canais", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                .setColor(dbc.get("color"))
                .setDescription(`Olá ${interaction.user} 👋.\n- Configure os canais de vendas do seu bot.`)
                .addFields(
                    {
                        name: `Sistema Logs Carrinho:`,
                        value: dbc.get(`canais.sistema_carrinho`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`",
                        inline:true
                    },
                    {
                        name: `Canal Vendas Privado:`,
                        value: `${canal_privv || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Canal Vendas Públicas:`,
                        value: `${canal_publicv || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Canal FeedBacks:`,
                        value: `${feedback || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Cargo Cliente:`,
                        value: `${cargoCliente || "Não Definido"}`,
                        inline:true
                    },
                    {
                        name: `Cargo Staff:`,
                        value: `${cargoStaff || "Não Definido"}`,
                        inline:true
                    },
                )
                .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
                let emjon = dbep.get(`4`)
                let emjoff = dbep.get(`2`)
                let emjvol = dbep.get(`29`)
                const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setStyle(dbc.get(`canais.sistema_carrinho`) === "ON" ? 3 : 4)
                    .setCustomId(`config_pagamentos_canais_sistemacarrinho`)
                    .setLabel("Sistema Logs Carrinho")
                    .setEmoji(dbc.get(`canais.sistema_carrinho`) === "ON" ? emjon : emjoff),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_priv`)
                    .setLabel(`Canal Vendas Privada`),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_public`)
                    .setLabel(`Canal Vendas Publicas`),
                )
                const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_feedback`)
                    .setLabel(`Canal FeedBacks`),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_cargocliente`)
                    .setLabel(`Cargo Cliente`),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_canais_cargostaff`)
                    .setLabel(`Cargo Staff`),
                    new ButtonBuilder()
                    .setStyle(1)
                    .setCustomId(`config_pagamentos`)
                    .setLabel(`Voltar`)
                    .setEmoji(emjvol),
                )
                await interaction.update({ embeds: [embed], components: [row, row2], content: "", ephemeral:true})
                interaction.followUp({ content: `${dbe.get(`6`)} | Alterado! Novo cargo cliente é ${cargoCliente}.`, ephemeral:true})
            }
        }
        if (interaction.customId === "config_pagamentos") {
            let sistema = `\`🔴 Desligado\``
            if (dbc.get(`pagamentos.sistema`) === "ON") sistema = `\`🟢 Ligado\``

            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Pagamentos", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Ajuste o sistema de vendas, escolha o método de pagamento e configure canais e cargos.`)
            .addFields(
                {
                    name: `Sistema Geral:`,
                    value: `${sistema}`,
                    inline:true
                },
                {
                    name: "Latência",
                    value: `${client.ws.ping} ms`,
                    inline:true
                }
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            let emjon = dbep.get(`4`)
            let emjoff = dbep.get(`2`)
            let emjmp = dbep.get(`16`)
            let emjdin = dbep.get(`9`)
            let emjpas = dbep.get(`30`)
            let emjvol = dbep.get(`29`)

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`pagamentos.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_pagamentos_sistema`)
                .setLabel("Sistema")
                .setEmoji(dbc.get(`pagamentos.sistema`) === "ON" ? emjon : emjoff),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId("config_pagamentos_método")
                .setLabel('Método de Pagamento')
                .setEmoji(dbep.get("15")),
            )
            const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_canais`)
                .setLabel("Canais & Cargos")
                .setEmoji(emjpas),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_voltar`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol),
            )
            await interaction.update({ embeds: [embed], components: [row, row2], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_pagamentos_método") {
            let sistema = `\`🔴 Desligado\``
            if (dbc.get(`pagamentos.sistema`) === "ON") sistema = `\`🟢 Ligado\``

            const embed = new EmbedBuilder()
            .setAuthor({ name: "Método de Pagamento", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Gerencie o método de pagamento que você vai usar para vender.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            let emjmp = dbep.get(`16`)
            let emjdin = dbep.get(`9`)
            let emjsac = dbep.get(`3`)
            let emjvol = dbep.get(`29`)
            let emjefi = dbep.get(`45`)

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_auto`)
                .setLabel(`Mercado Pago`)
                .setEmoji(emjmp),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_semiauto`)
                .setLabel(`Semi-Automático`)
                .setEmoji(emjdin),
            )
            const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_sales`)
                .setLabel("eSales")
                .setEmoji(emjsac),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_EfiBank`)
                .setLabel(`Efi Bank`)
                .setEmoji(emjefi),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol),
            )
            await interaction.update({ embeds: [embed], components: [row, row2], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_pagamentos_EfiBank") {
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
        async function formatValor(valor) {
            return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }
        async function config_pagamentos_sales(interaction) {
            const timestamp = Math.floor(new Date(dbs.get("ultimoSaque")).getTime() / 1000)
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Gerenciando eSales", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Veja algumas informações do sistema **eSales** abaixo.`)
            .addFields(
                { name: "O que é o eSales?", value: `> O __**eSales**__ permite a venda automática dos seus produtos com segurança, com a **Zend Applications** intermediando as transações. Seus ganhos ficam disponíveis para saque diretamente pelo sistema, de forma prática e confiável.` },
                { name: "Como funciona o saque?", value: "> Para sacar seu saldo no eSales, clique no botão de retirada e insira sua chave Pix e o nome do recebedor. O valor mínimo para saque é de __R$1,00__ e será cobrada uma __taxa de processamento de 5%__ sobre o valor total. Após a solicitação, o valor será transferido para você em até 2 dias úteis, garantindo segurança e precisão na transação." },
                { name: "Sistema", value: `${dbs.get("sistema") === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`, inline:true },
                { name: "Saldo Atual:", value: `${dbe.get("3")} | R$${await formatValor(dbs.get("saldo")) || "0"}`, inline:true },
                { name: `Ultimo Saque:`, value: `${dbs.get("ultimoSaque") ? `<t:${timestamp}:f> (<t:${timestamp}:R>)` : `${dbe.get("13")} | Não foi feito nenhum saque até o momento.`}`, inline:true }
            )

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbs.get("sistema") === "ON" ? 3 : 4)
                .setCustomId("config_pagamentos_sales_sistema")
                .setLabel(`Sistema (${dbs.get("sistema") === "ON" ? "ligado" : "desligado"})`)
                .setEmoji(dbs.get("sistema") === "ON" ? dbep.get("4") : dbep.get("2")),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId("config_pagamentos_sales_saque")
                .setLabel("Sacar Saldo")
                .setEmoji(dbep.get("3"))
            )
            const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId("config_pagamentos_sales_historico")
                .setLabel("Histórico de Saques")
                .setDisabled(true)
                .setEmoji(dbep.get("18")),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId("config_pagamentos_método")
                .setLabel("Voltar")
                .setEmoji(dbep.get("29"))
            )
            await interaction.update({ embeds: [embed], components: [row, row2]})
        }
        if (interaction.customId === 'config_pagamentos_sales_saque') {
            const statusGlob = dbs.get("eSalesGlob")
            if (statusGlob === "OFF") return interaction.reply({ ephemeral:true, content: `${dbe.get("13")} | O sistema **eSales** está temporáriamente desativado, aguarde alguns minutos.`})

            const valor = Number(dbs.get('saldo'))
            if (dbs.get("sistema") === "OFF") return interaction.reply({ content: `${dbe.get("13")} | O sistema **eSales** não está ligado!`, ephemeral:true });
            if (valor < 1) return interaction.reply({ content: `${dbe.get("13")} | Você não tem saldo o suficiente para sacar o dinheiro! O mínimo é de R$1,00.`, ephemeral:true });
            const historico = dbs.get("historico") || []
            const find = historico.find(a => a.status === "pendente")
            if (find) return interaction.reply({ content: `${dbe.get("13")} | O bot tem um saque pendente, aguarde o recebimento do saque!`, ephemeral:true });
            const modal = new ModalBuilder()
            .setCustomId("modal_config_pagamentos_sales_saque")
            .setTitle(`Sacando Saldo (R$${await formatValor(dbs.get("saldo"))})`)

            const text = new TextInputBuilder()
            .setStyle(1)
            .setCustomId("text")
            .setLabel("Nome do Recebedor")
            .setPlaceholder("Coloque o nome quem vai receber o pix.")

            const text2 = new TextInputBuilder()
            .setStyle(1)
            .setCustomId("text2")
            .setLabel("Tipo da Chave")
            .setPlaceholder("Coloque o tipo da chave. Ex: CPF / Aleatória / Celular")

            const text3 = new TextInputBuilder()
            .setStyle(1)
            .setCustomId("text3")
            .setLabel("Chave Pix")
            .setPlaceholder("Coloque a chave pix.")

            modal.addComponents(new ActionRowBuilder().addComponents(text))
            modal.addComponents(new ActionRowBuilder().addComponents(text2))
            modal.addComponents(new ActionRowBuilder().addComponents(text3))

            interaction.showModal(modal)
        }
        if (interaction.isModalSubmit() && interaction.customId === "modal_config_pagamentos_sales_saque") {
            const recebedor = interaction.fields.getTextInputValue("text");
            const tipo = interaction.fields.getTextInputValue("text2");
            const chave = interaction.fields.getTextInputValue("text3");
            const taxado = 0.95;
            const axios = require("axios");
            const valor = await formatValor(Number(await dbs.get("saldo")) * taxado);
            const valorSeco = await dbs.get("saldo");
            const valorTaxado = Number(await dbs.get("saldo")) * taxado;
            const taxa = Number(await dbs.get("saldo")) * await dbs.get("taxa");
        
            // Verifica se o usuário já fez um saque nas últimas 24 horas
            const ultimoSaque = await dbs.get(`ultimoSaque_${interaction.user.id}`);
            const agora = Date.now();
        
            if (ultimoSaque && (agora - ultimoSaque) < 24 * 60 * 60 * 1000) {
                const tempoRestante = ((24 * 60 * 60 * 1000) - (agora - ultimoSaque)) / (1000 * 60 * 60);
                return interaction.reply({ 
                    content: `❌ | Você só pode realizar um novo saque em ${tempoRestante.toFixed(1)} horas.`, 
                    ephemeral: true 
                });
            }
        
            axios.post('https://zendapplications.com/api/saque/realizar', {
                valor: valorTaxado,
                userId: interaction.user.id,
                chave: chave,
                tipo: tipo,
                nome: recebedor,
                taxa: taxa
            }).then(async (response) => {
                const data = response.data;
        
                // Atualizar histórico e saldo
                dbs.push(`historico`, {
                    id: data.idSaque,
                    horario: data.horario,
                    userId: interaction.user.id,
                    status: "pendente",
                    valor: valor,
                });
                dbs.substr(`saldo`, valorSeco);
                dbs.set(`ultimoSaque_${interaction.user.id}`, agora);
        
                // Criar o embed de confirmação
                const embed = new EmbedBuilder()
                    .setAuthor({ name: "Solicitação de Saque", iconURL: interaction.user.displayAvatarURL() })
                    .setColor("Yellow")
                    .setDescription(`Olá ${interaction.user}. 👋\n- Você fez uma solicitação de saque, veja as informações à seguir:`)
                    .setFields(
                        { name: `Informações:`, value: `> **Chave:** ${chave} - ${tipo}\n> **Recebedor:** ${recebedor}\n> **Valor:** ${valor}`, inline: false },
                        { name: `Status Atual:`, value: `\`🟠 ${data.status}\``, inline: true },
                        { name: `ID do pedido:`, value: `- \`${data.idSaque}\``, inline: true }
                    )
                    .setFooter({ text: "Sistema de Zend Applications - Todos os Direitos Reservados" })
                    .setTimestamp();
        
                await config_pagamentos_sales(interaction);
        
                try {
                    const msg = await interaction.user.send({ embeds: [embed] });
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(5)
                                .setURL(msg.url)
                                .setLabel("Ir para a mensagem")
                        );
        
                    await interaction.followUp({ content: `${dbe.get("6")} | Pedido de saque realizado com sucesso! Verifique seu privado para mais informações.`, components: [row], ephemeral: true });
                } catch {
                    await interaction.followUp({ embeds: [embed], ephemeral: true });
                }
            }).catch(async (error) => {
                console.error('Erro ao fazer a requisição:', error.response);
                await interaction.reply({ content: `${dbe.get("13")} | Ocorreu um erro ao tentar realizar o saque!`, ephemeral: true });
            });
        }
        
        
        if (interaction.customId === "config_pagamentos_sales") {
            config_pagamentos_sales(interaction)
        }
        if (interaction.customId === "config_pagamentos_sales_sistema") {
            dbs.get("sistema") === "ON" ? dbs.set("sistema", "OFF") : dbs.set("sistema", "ON")
            config_pagamentos_sales(interaction)
        }
        if (interaction.customId === "config_pagamentos_sistema") {
            if (dbc.get(`pagamentos.sistema`) === "ON") {
                dbc.set(`pagamentos.sistema`, "OFF") 
            } else {
                dbc.set(`pagamentos.sistema`, "ON") 
            }
            let sistema = `\`🔴 Desligado\``
            if (dbc.get(`pagamentos.sistema`) === "ON") sistema = `\`🟢 Ligado\``

            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Pagamentos", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Ajuste o sistema de vendas, escolha o método de pagamento e configure canais e cargos.`)
            .addFields(
                {
                    name: `Sistema Geral:`,
                    value: `${sistema}`,
                    inline:true
                },
                {
                    name: "Latência",
                    value: `${client.ws.ping} ms`,
                    inline:true
                }
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            let emjon = dbep.get(`4`)
            let emjoff = dbep.get(`2`)
            let emjmp = dbep.get(`16`)
            let emjdin = dbep.get(`9`)
            let emjpas = dbep.get(`30`)
            let emjvol = dbep.get(`29`)

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`pagamentos.sistema`) === "ON" ? 3 : 4)
                .setCustomId(`config_pagamentos_sistema`)
                .setLabel("Sistema")
                .setEmoji(dbc.get(`pagamentos.sistema`) === "ON" ? emjon : emjoff),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId("config_pagamentos_método")
                .setLabel('Método de Pagamento')
                .setEmoji(dbep.get("15")),
            )
            const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_canais`)
                .setLabel("Canais & Cargos")
                .setEmoji(emjpas),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_voltar`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol),
            )
            await interaction.update({ embeds: [embed], components: [row, row2], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_pagamentos_semiauto") {
            let sistema = `\`🔴 Desligado\``
            if (dbc.get(`pagamentos.sistema_semiauto`) === "ON") sistema = `\`🟢 Ligado\``
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Pagamentos", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de vendas semiautomáticas e veja algumas informações abaixo.`)
            .addFields(
                {
                    name: `Sistema SemiAuto:`,
                    value: `${sistema}`,
                    inline:true
                },
                {
                    name: "Chave Pix:",
                    value: `${dbc.get(`pagamentos.semiauto.chave`) || "Não Definido"} | Tipo: ${dbc.get(`pagamentos.semiauto.tipo`) || "Não Definido"}`,
                    inline:true
                },
                {
                    name: "QR Code",
                    value: `${dbc.get(`pagamentos.semiauto.qrcode`) ? `[Clique aqui para ver](${dbc.get(`pagamentos.semiauto.qrcode`)})` : "Não Definido"}`,
                    inline:true
                },
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            let emjon = dbep.get(`4`)
            let emjoff = dbep.get(`2`)
            let emjcha = dbep.get(`32`)
            let emjqrc = dbep.get(`33`)
            let emjvol = dbep.get(`29`)

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`pagamentos.sistema_semiauto`) === "ON" ? 3 : 4)
                .setCustomId(`config_pagamentos_semiauto_sistema`)
                .setLabel("Sistema")
                .setEmoji(dbc.get(`pagamentos.sistema_semiauto`) === "ON" ? emjon : emjoff),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_semiauto_chave`)
                .setLabel(`Alterar Chave Pix & Tipo`)
                .setEmoji(emjcha),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_semiauto_qrcode`)
                .setLabel(`Alterar QR Code`)
                .setEmoji(emjqrc),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos_método`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol),
            )
            await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_pagamentos_semiauto_qrcode") {
            const modal = new ModalBuilder()
            .setCustomId("modal_config_pagamentos_semiauto_qrcode")
            .setTitle("Alterando Informações PIX")

            const text = new TextInputBuilder()
            .setCustomId("text")
            .setLabel("QR Code")
            .setRequired(false)
            .setPlaceholder("Digite o link aqui ✏")
            .setStyle(1)

            modal.addComponents(new ActionRowBuilder().addComponents(text))
            
            return interaction.showModal(modal)
        }
        if (interaction.isModalSubmit() && interaction.customId === "modal_config_pagamentos_semiauto_qrcode") {
            const link = interaction.fields.getTextInputValue("text");
            const msg = await interaction.update({ content: `${dbe.get(`16`)} | Aguarde...`, ephemeral: true });
            
            const fs = require('fs');
            const axios = require('axios');
            const sharp = require('sharp');
            
            const imagePath = './Imagens/pagamentos/qrcode.png';
            const dirPath = './Imagens/pagamentos';
            
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            async function updateEmbed(msg) {
                let sistema = `\`🔴 Desligado\``;
                if (dbc.get(`pagamentos.sistema_semiauto`) === "ON") sistema = `\`🟢 Ligado\``;
                let emjon = dbep.get(`4`);       // Emoji para o sistema ligado
                let emjoff = dbep.get(`2`);      // Emoji para o sistema desligado
                let emjcha = dbep.get(`32`);     // Emoji para a chave Pix
                let emjqrc = dbep.get(`33`);     // Emoji para o QR Code
                let emjvol = dbep.get(`29`);     // Emoji para o botão de voltar
                
                const embed = new EmbedBuilder()
                    .setAuthor({ name: "Configurando Pagamentos", iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                    .setColor(dbc.get("color"))
                    .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de vendas semiautomáticas e veja algumas informações abaixo.`)
                    .addFields(
                        {
                            name: `Sistema SemiAuto:`,
                            value: `${sistema}`,
                            inline: true
                        },
                        {
                            name: "Chave Pix:",
                            value: `${dbc.get(`pagamentos.semiauto.chave`) || "Não Definido"} | Tipo: ${dbc.get(`pagamentos.semiauto.tipo`) || "Não Definido"}`,
                            inline: true
                        },
                        {
                            name: "QR Code",
                            value: `${dbc.get(`pagamentos.semiauto.qrcode`) ? `[Clique aqui para ver](${dbc.get(`pagamentos.semiauto.qrcode`)})` : "Não Definido"}`,
                            inline: true
                        },
                    )
                    .setThumbnail(interaction.guild.iconURL({ dynamic: true }));
            
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(dbc.get(`pagamentos.sistema_semiauto`) === "ON" ? 3 : 4)
                            .setCustomId(`config_pagamentos_semiauto_sistema`)
                            .setLabel("Sistema")
                            .setEmoji(dbc.get(`pagamentos.sistema_semiauto`) === "ON" ? emjon : emjoff),
                        new ButtonBuilder()
                            .setStyle(2)
                            .setCustomId(`config_pagamentos_semiauto_chave`)
                            .setLabel(`Alterar Chave Pix & Tipo`)
                            .setEmoji(emjcha),
                        new ButtonBuilder()
                            .setStyle(2)
                            .setCustomId(`config_pagamentos_semiauto_qrcode`)
                            .setLabel(`Alterar QR Code`)
                            .setEmoji(emjqrc),
                        new ButtonBuilder()
                            .setStyle(1)
                            .setCustomId(`config_pagamentos_método`)
                            .setLabel(`Voltar`)
                            .setEmoji(emjvol),
                    );
            
                msg.edit({ embeds: [embed], components: [row], content: "", ephemeral: true });
            }
            if (link) {
                if (link.startsWith("https://")) {
                    try {
                        const headResponse = await axios.head(link);
                        const contentType = headResponse.headers['content-type'];
                
                        if (contentType.startsWith('image/')) {
                            const response = await axios({
                                url: link,
                                responseType: 'arraybuffer'
                            });
                
                            await sharp(response.data)
                                .png()
                                .toFile(imagePath, async (err) => {
                                    if (err) {
                                        interaction.followUp({ content: `${dbe.get(`13`)} | Erro ao converter a imagem para PNG.`, ephemeral: true });
                                    } else {
                                        await dbc.set(`pagamentos.semiauto.qrcode`, link);
                                        interaction.followUp({ content: `${dbe.get(`6`)} | QR Code setado com sucesso!`, ephemeral: true });
                                        
                                        // Atualiza a embed com as informações mais recentes
                                        updateEmbed(msg);
                                    }
                                });
                        } else {
                            interaction.followUp({ content: `${dbe.get(`13`)} | O link não aponta para uma imagem!`, ephemeral: true });
                        }
                    } catch (error) {
                        interaction.followUp({ content: `${dbe.get(`13`)} | Erro ao verificar o link ou baixar a imagem.`, ephemeral: true });
                    }
                } else {
                    interaction.followUp({ content: `${dbe.get(`13`)} | Link inválido ou não é uma imagem!`, ephemeral: true });
                }
            } else {
                // Nenhuma informação foi passada; tenta excluir a imagem existente
                if (fs.existsSync(imagePath)) {
                    fs.unlink(imagePath, async (err) => {
                        if (err) {
                            interaction.followUp({ content: `${dbe.get(`13`)} | Erro ao excluir a imagem.`, ephemeral: true });
                        } else {
                            await dbc.delete(`pagamentos.semiauto.qrcode`);
                            interaction.followUp({ content: `${dbe.get(`6`)} | QR Code excluído com sucesso!`, ephemeral: true });
                            
                            // Atualiza a embed com as informações mais recentes
                            updateEmbed(msg);
                        }
                    });
                } else {
                    interaction.followUp({ content: `${dbe.get(`13`)} | Nenhum QR Code para excluir.`, ephemeral: true });
                }
            }
        }
        
        
        
        if (interaction.customId === "config_pagamentos_semiauto_chave") {
            const modal = new ModalBuilder()
            .setCustomId("modal_config_pagamentos_semiauto_chave")
            .setTitle("Alterando Informações PIX")

            const text = new TextInputBuilder()
            .setCustomId("text")
            .setLabel("Chave Pix")
            .setPlaceholder("Digite aqui ✏")
            .setStyle(1)
            .setValue(dbc.get(`pagamentos.semiauto.chave`))
            const text2 = new TextInputBuilder()
            .setCustomId("text2")
            .setLabel("Tipo da Chave")
            .setPlaceholder("Ex: CPF / EMAIL / NÚMERO.")
            .setStyle(1)

            modal.addComponents(new ActionRowBuilder().addComponents(text))
            modal.addComponents(new ActionRowBuilder().addComponents(text2))
            
            return interaction.showModal(modal)
        }
        if (interaction.isModalSubmit() && interaction.customId === "modal_config_pagamentos_semiauto_chave") {
            const chave = interaction.fields.getTextInputValue("text");
            const tipo = interaction.fields.getTextInputValue("text2");


            dbc.set(`pagamentos.semiauto.chave`, chave)
            dbc.set(`pagamentos.semiauto.tipo`, tipo)

            let sistema = `\`🔴 Desligado\``
            if (dbc.get(`pagamentos.sistema_semiauto`) === "ON") sistema = `\`🟢 Ligado\``
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Pagamentos", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de vendas semiautomáticas e veja algumas informações abaixo.`)
            .addFields(
                {
                    name: `Sistema SemiAuto:`,
                    value: `${sistema}`,
                    inline:true
                },
                {
                    name: "Chave Pix:",
                    value: `${dbc.get(`pagamentos.semiauto.chave`) || "Não Definido"} | Tipo: ${dbc.get(`pagamentos.semiauto.tipo`) || "Não Definido"}`,
                    inline:true
                },
                {
                    name: "QR Code",
                    value: `${dbc.get(`pagamentos.semiauto.qrcode`) ? `[Clique aqui para ver](${dbc.get(`pagamentos.semiauto.qrcode`)})` : "Não Definido"}`,
                    inline:true
                },
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            let emjon = dbep.get(`4`)
            let emjoff = dbep.get(`2`)
            let emjcha = dbep.get(`32`)
            let emjqrc = dbep.get(`33`)
            let emjvol = dbep.get(`29`)

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`pagamentos.sistema_semiauto`) === "ON" ? 3 : 4)
                .setCustomId(`config_pagamentos_semiauto_sistema`)
                .setLabel("Sistema")
                .setEmoji(dbc.get(`pagamentos.sistema_semiauto`) === "ON" ? emjon : emjoff),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_semiauto_chave`)
                .setLabel(`Alterar Chave Pix & Tipo`)
                .setEmoji(emjcha),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_semiauto_qrcode`)
                .setLabel(`Alterar QR Code`)
                .setEmoji(emjqrc),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos_método`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol),
            )
            await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
            interaction.followUp({ content: `${dbe.get(`6`)} | Chave Pix e Tipo adicionados com sucesso!`, ephemeral:true})
        }
        if (interaction.customId === "config_pagamentos_semiauto_sistema") {
            if (dbc.get(`pagamentos.sistema_auto`) === "ON") {
                dbc.set(`pagamentos.sistema_auto`, "OFF") 
                dbc.set(`pagamentos.sistema_semiauto`, "ON") 
            } else {
                dbc.set(`pagamentos.sistema_auto`, "ON") 
                dbc.set(`pagamentos.sistema_efi`, "OFF")
                dbc.set(`pagamentos.sistema_semiauto`, "OFF") 
            }
            let sistema = `\`🔴 Desligado\``
            if (dbc.get(`pagamentos.sistema_semiauto`) === "ON") sistema = `\`🟢 Ligado\``
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Pagamentos", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de vendas semiautomáticas e veja algumas informações abaixo.`)
            .addFields(
                {
                    name: `Sistema SemiAuto:`,
                    value: `${sistema}`,
                    inline:true
                },
                {
                    name: "Chave Pix:",
                    value: `${dbc.get(`pagamentos.semiauto.chave`) || "Não Definido"} | Tipo: ${dbc.get(`pagamentos.semiauto.tipo`) || "Não Definido"}`,
                    inline:true
                },
                {
                    name: "QR Code",
                    value: `${dbc.get(`pagamentos.semiauto.qrcode`) ? `[Clique aqui para ver](${dbc.get(`pagamentos.semiauto.qrcode`)})` : "Não Definido"}`,
                    inline:true
                },
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            let emjon = dbep.get(`4`)
            let emjoff = dbep.get(`2`)
            let emjcha = dbep.get(`32`)
            let emjqrc = dbep.get(`33`)
            let emjvol = dbep.get(`29`)

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`pagamentos.sistema_semiauto`) === "ON" ? 3 : 4)
                .setCustomId(`config_pagamentos_semiauto_sistema`)
                .setLabel("Sistema")
                .setEmoji(dbc.get(`pagamentos.sistema_semiauto`) === "ON" ? emjon : emjoff),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_semiauto_chave`)
                .setLabel(`Alterar Chave Pix & Tipo`)
                .setEmoji(emjcha),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_semiauto_qrcode`)
                .setLabel(`Alterar QR Code`)
                .setEmoji(emjqrc),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos_método`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol),
            )
            await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_pagamentos_auto") {
            let sistema = `\`🔴 Desligado\``
            if (dbc.get(`pagamentos.sistema_auto`) === "ON") sistema = `\`🟢 Ligado\``
            var banksBloqued = '';
            dbc.get(`pagamentos.blockbank`).map((entry, index) => {banksBloqued += `||${entry}||\n`;});
            if(await dbc.get("pagamentos.blockbank").length <= 0) banksBloqued = "`Nenhum Banco foi Bloqueado`";
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Pagamentos", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de vendas automáticas e veja algumas informações abaixo.`)
            .addFields(
                {
                    name: `Sistema Automático:`,
                    value: `${sistema}`,
                    inline:true
                },
                {
                    name: "Acess Token:",
                    value: `||${dbc.get(`pagamentos.acess_token_tipo`) === "menor" ? "Autenticação Rápida Abilitada" : dbc.get(`pagamentos.acess_token`) || "Não Definido"}||`,
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

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`pagamentos.sistema_auto`) === "ON" ? 3 : 4)
                .setCustomId(`config_pagamentos_auto_sistema`)
                .setLabel("Sistema")
                .setEmoji(dbc.get(`pagamentos.sistema_auto`) === "ON" ? emjon : emjoff),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_auto_acesstk`)
                .setLabel(`Alterar Acess Token`)
                .setEmoji(emjmp),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_auto_bank`)
                .setLabel(`Bloquear Bancos`)
                .setEmoji(emjesc),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos_método`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol),
            )
            await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_pagamentos_auto_sistema") {
            if (dbc.get(`pagamentos.sistema_auto`) === "ON") {
                dbc.set(`pagamentos.sistema_auto`, "OFF") 
                dbc.set(`pagamentos.sistema_semiauto`, "ON") 
            } else {
                dbc.set(`pagamentos.sistema_auto`, "ON") 
                dbc.set(`pagamentos.sistema_efi`, "OFF")
                dbc.set(`pagamentos.sistema_semiauto`, "OFF") 
            }
            let sistema = `\`🔴 Desligado\``
            if (dbc.get(`pagamentos.sistema_auto`) === "ON") sistema = `\`🟢 Ligado\``
            var banksBloqued = '';
            dbc.get(`pagamentos.blockbank`).map((entry, index) => {banksBloqued += `||${entry}||\n`;});
            if(await dbc.get("pagamentos.blockbank").length <= 0) banksBloqued = "`Nenhum Banco foi Bloqueado`";
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Pagamentos", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de vendas automáticas e veja algumas informações abaixo.`)
            .addFields(
                {
                    name: `Sistema Automático:`,
                    value: `${sistema}`,
                    inline:true
                },
                {
                    name: "Acess Token:",
                    value: `||${dbc.get(`pagamentos.acess_token_tipo`) === "menor" ? "Autenticação Rápida Abilitada" : dbc.get(`pagamentos.acess_token`) || "Não Definido"}||`,
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

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(dbc.get(`pagamentos.sistema_auto`) === "ON" ? 3 : 4)
                .setCustomId(`config_pagamentos_auto_sistema`)
                .setLabel("Sistema")
                .setEmoji(dbc.get(`pagamentos.sistema_auto`) === "ON" ? emjon : emjoff),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_auto_acesstk`)
                .setLabel(`Alterar Acess Token`)
                .setEmoji(emjmp),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_auto_bank`)
                .setLabel(`Bloquear Bancos`)
                .setEmoji(emjesc),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos_método`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol),
            )
            await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_pagamentos_auto_bank") {
            let sistema = `\`🔴 Desligado\``
            if (dbc.get(`pagamentos.sistema_auto`) === "ON") sistema = `\`🟢 Ligado\``
            var banksBloqued = '';

            dbc.get(`pagamentos.blockbank`).map((entry, index) => {banksBloqued += `||${entry}||\n`;});
            if(await dbc.get("pagamentos.blockbank").length <= 0) banksBloqued = "`Nenhum Banco foi Bloqueado`";
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Bloqueando Bancos", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Escreva os nomes de bancos que será bloqueados de serem usados para efetuar as compras.`)            
            .addFields(
                {
                    name: "Bancos Bloqueados:",
                    value: `${banksBloqued}`,
                    inline:true
                }
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            let emjesc = dbep.get(`22`)
            let emjvol = dbep.get(`29`)
            const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_auto_bank_ar`)
                .setLabel(`Adicionar/Remover Banco`)
                .setEmoji(emjesc),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos_auto`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol)
            )
            await interaction.update({ content: ``, embeds: [embed], components: [row2]})
        }
        if (interaction.customId === "config_pagamentos_auto_bank_ar") {
            const modal = new ModalBuilder()
            .setCustomId("modal_config_pagamentos_auto_bank_ar")
            .setTitle("Adicionar ou Remover Banco")

            const text = new TextInputBuilder()
            .setCustomId("text_modal")
            .setLabel("Digite o nome do banco.")
            .setPlaceholder("Para cada banco você deve colocar uma vírgula e espaço! Ex: inter, picpay")
            .setStyle(2)

            modal.addComponents(new ActionRowBuilder().addComponents(text))
            
            return interaction.showModal(modal)
        }
        if (interaction.isModalSubmit() && interaction.customId === "modal_config_pagamentos_auto_bank_ar") {
            const text = interaction.fields.getTextInputValue("text_modal").toLowerCase();
            let pagamentos = dbc.get("pagamentos.blockbank") || [];
            
            const msg = await interaction.update({ content: `${dbe.get(`16`)} | Aguarde...`, ephemeral:true})

            const bancos = text.split(", ")

            dbc.set("pagamentos.blockbank", bancos);
            interaction.followUp({ content: `${dbe.get(`6`)} | Informações atualizadas com sucesso!`, ephemeral:true})
            let sistema = `\`🔴 Desligado\``
            if (dbc.get(`pagamentos.sistema_auto`) === "ON") sistema = `\`🟢 Ligado\``
            var banksBloqued = '';

            dbc.get(`pagamentos.blockbank`).map((entry, index) => {banksBloqued += `||${entry}||\n`;});
            if(await dbc.get("pagamentos.blockbank").length <= 0) banksBloqued = "`Nenhum Banco foi Bloqueado`";
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Bloqueando Bancos", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Escreva os nomes de bancos que será bloqueados de serem usados para efetuar as compras.`)            
            .addFields(
                {
                    name: "Bancos Bloqueados:",
                    value: `${banksBloqued}`,
                    inline:true
                }
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            let emjesc = dbep.get(`22`)
            let emjvol = dbep.get(`29`)
            const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_auto_bank_ar`)
                .setLabel(`Adicionar/Remover Banco`)
                .setEmoji(emjesc),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos_auto`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol)
            )
            msg.edit({ content: ``, embeds: [embed], components: [row2]})
        }
        if (interaction.customId === "config_pagamentos_auto_acesstk") {
            let sistema = `\`🔴 Desligado\``
            if (dbc.get(`pagamentos.sistema_auto`) === "ON") sistema = `\`🟢 Ligado\``
            var banksBloqued = '';
            dbc.get(`pagamentos.blockbank`).map((entry, index) => {banksBloqued += `||${entry}||\n`;});
            if(await dbc.get("pagamentos.blockbank").length <= 0) banksBloqued = "`Nenhum Banco foi Bloqueado`";
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Pagamentos", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Selecione abaixo qual opção você deseja atribuír o seu **ACESS TOKEN** ao **BOT**.`)
            .addFields()
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            let emjvol = dbep.get(`29`)

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_auto_acessmaior`)
                .setLabel(`Alterar Acess Token`),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_pagamentos_auto_acessmenor`)
                .setDisabled(true)
                .setLabel(`Autenticação Rápida`),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos_auto`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol),
            )
            await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_pagamentos_auto_acessmenor") {
            const msg = await interaction.update({ content: `${dbe.get(`16`)} | Aguarde...`, ephemeral:true})

            let c = await dbaa.create({
                code: "indefinida"
            })
            let string = c._id
            const link = `https://auth.mercadopago.com.br/authorization?client_id=${info.clientId}&response_type=code&platform_id=mp&state=${string}&redirerect_uri=${info.red}`;
            let sistema = `\`🔴 Desligado\``
            if (dbc.get(`pagamentos.sistema_auto`) === "ON") sistema = `\`🟢 Ligado\``
            var banksBloqued = '';
            dbc.get(`pagamentos.blockbank`).map((entry, index) => {banksBloqued += `||${entry}||\n`;});
            if(await dbc.get("pagamentos.blockbank").length <= 0) banksBloqued = "`Nenhum Banco foi Bloqueado`";
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Pagamentos", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Clique no botão **AUTORIZAR MERCADO PAGO** para que o seu acess token seja gerado.\n- Lembrando que não será cobrado taxas ou tarifas sobre suas vendas por parte da **Zend Applications**.`)
            .addFields()
            .setThumbnail(interaction.guild.iconURL({ dynamic:true }))
            let emjvol = dbep.get(`29`)

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(5)
                .setURL(link)
                .setLabel(`Autorizar Mercado Pago`),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_pagamentos_auto_acesstk`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol),
            )
            msg.edit({ embeds: [embed], components: [row], content: "", ephemeral:true})

            const interval = await setInterval(async() => {
                let stringDB = await dbaa.findOne({ _id: string })
                let info = await dbac.findOne({ id: "teste" })
                if (stringDB.code !== "indefinida") {
                    clearInterval(interval)
                    const axios = require("axios")
                    const tokenUrl = 'https://api.mercadopago.com/oauth/token';
  
                    axios.post(tokenUrl, null, {
                        params: {
                            grant_type: 'authorization_code',
                            client_id: info.clientId,
                            client_secret: info.clientSecret,
                            code: stringDB.code,
                            redirect_uri: info.red,
                        },
                    }).then(response => {
                        dbc.set(`pagamentos.acess_token`, response.data.access_token)
                        dbc.set(`pagamentos.acess_token_tipo`, "menor")
                        interaction.followUp({ content: `${dbe.get(`6`)} | Acess token gerado e setado com sucesso!`, ephemeral:true})
                    }).catch(() => {
                        interaction.followUp({ content: `${dbe.get(`13`)} | Ocorreu um erro ao gerar o acess token!`, ephemeral:true})
                    })
                    let sistema = `\`🔴 Desligado\``
                    if (dbc.get(`pagamentos.sistema_auto`) === "ON") sistema = `\`🟢 Ligado\``
                    var banksBloqued = '';
                    dbc.get(`pagamentos.blockbank`).map((entry, index) => {banksBloqued += `||${entry}||\n`;});
                    if(await dbc.get("pagamentos.blockbank").length <= 0) banksBloqued = "`Nenhum Banco foi Bloqueado`";
                    const embed = new EmbedBuilder()
                    .setAuthor({ name: "Configurando Pagamentos", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                    .setColor(dbc.get("color"))
                    .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de vendas automáticas e veja algumas informações abaixo.`)
                    .addFields(
                        {
                            name: `Sistema Automático:`,
                            value: `${sistema}`,
                            inline:true
                        },
                        {
                            name: "Acess Token:",
                            value: `||${dbc.get(`pagamentos.acess_token_tipo`) === "menor" ? "Autenticação Rápida Abilitada" : dbc.get(`pagamentos.acess_token`) || "Não Definido"}||`,
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
        
                    const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setStyle(dbc.get(`pagamentos.sistema_auto`) === "ON" ? 3 : 4)
                        .setCustomId(`config_pagamentos_auto_sistema`)
                        .setLabel("Sistema")
                        .setEmoji(dbc.get(`pagamentos.sistema_auto`) === "ON" ? emjon : emjoff),
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId(`config_pagamentos_auto_acesstk`)
                        .setLabel(`Alterar Acess Token`)
                        .setEmoji(emjmp),
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId(`config_pagamentos_auto_bank`)
                        .setLabel(`Bloquear Bancos`)
                        .setEmoji(emjesc),
                        new ButtonBuilder()
                        .setStyle(1)
                        .setCustomId(`config_pagamentos_método`)
                        .setLabel(`Voltar`)
                        .setEmoji(emjvol),
                    )
                    msg.edit({ embeds: [embed], components: [row], content: "", ephemeral:true})
                }
            }, 10000);
            setTimeout(() => {
                clearInterval(interval)
            }, 1000 * 60 * 5);
        }
        if (interaction.customId === "config_pagamentos_auto_acessmaior") {
            const modal = new ModalBuilder()
            .setCustomId("modal_alterar_acesstoken")
            .setTitle("Alterar Acess Token")

            const text = new TextInputBuilder()
            .setCustomId("text_modal")
            .setLabel("Altere o Acess Token do Mercado Pago")
            .setPlaceholder("Digite aqui ✏")
            .setStyle(1)

            modal.addComponents(new ActionRowBuilder().addComponents(text))
            
            return interaction.showModal(modal)
        }
        if (interaction.isModalSubmit() && interaction.customId === "modal_alterar_acesstoken") {
            const text = interaction.fields.getTextInputValue("text_modal");

            if (text.startsWith("APP_USR-")) {
                dbc.set(`pagamentos.acess_token`, text)
                dbc.set(`pagamentos.acess_token_tipo`, "maior")
                let sistema = `\`🔴 Desligado\``
                if (dbc.get(`pagamentos.sistema_auto`) === "ON") sistema = `\`🟢 Ligado\``
                var banksBloqued = '';
                dbc.get(`pagamentos.blockbank`).map((entry, index) => {banksBloqued += `||${entry}||\n`;});
                if(await dbc.get("pagamentos.blockbank").length <= 0) banksBloqued = "`Nenhum Banco foi Bloqueado`";
                const embed = new EmbedBuilder()
                .setAuthor({ name: "Configurando Pagamentos", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                .setColor(dbc.get("color"))
                .setDescription(`Olá ${interaction.user} 👋.\n- Configure o sistema de vendas automáticas e veja algumas informações abaixo.`)
                .addFields(
                    {
                        name: `Sistema Automático:`,
                        value: `${sistema}`,
                        inline:true
                    },
                    {
                        name: "Acess Token:",
                        value: `||${dbc.get(`pagamentos.acess_token_tipo`) === "menor" ? "Autenticação Rápida Abilitada" : dbc.get(`pagamentos.acess_token`) || "Não Definido"}||`,
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
    
                const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setStyle(dbc.get(`pagamentos.sistema_auto`) === "ON" ? 3 : 4)
                    .setCustomId(`config_pagamentos_auto_sistema`)
                    .setLabel("Sistema")
                    .setEmoji(dbc.get(`pagamentos.sistema_auto`) === "ON" ? emjon : emjoff),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_auto_acesstk`)
                    .setLabel(`Alterar Acess Token`)
                    .setEmoji(emjmp),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_pagamentos_auto_bank`)
                    .setLabel(`Bloquear Bancos`)
                    .setEmoji(emjesc),
                    new ButtonBuilder()
                    .setStyle(1)
                    .setCustomId(`config_pagamentos`)
                    .setLabel(`Voltar`)
                    .setEmoji(emjvol),
                )
                await interaction.update({ embeds: [embed], components: [row], content: "", ephemeral:true})
                interaction.followUp({ content: `${dbe.get(`6`)} | Alterado!`, ephemeral:true})
            } else {
                interaction.reply({ content: `${dbe.get(`13`)}  | Coloque um Acess Token válido!`, ephemeral: true})
            }
        }
        if (interaction.customId === "config_voltar") {
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
            interaction.update({ embeds: [embed], components: [row, row2], content: "", ephemeral:true})
        }
        if (interaction.customId === "config_bot") {
            
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Bot", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o seu bot e veja algumas informações abaixo.`)
            .addFields(
                {
                    name: `Nome do Bot:`,
                    value: `${interaction.client.user.username}`,
                    inline:true
                },
                {
                    name: "Avatar do Bot:",
                    value: `[Clique aqui para ver!](${interaction.client.user.displayAvatarURL({ dynamic: true })})`,
                    inline:true
                },
                {
                    name: `Cor Atual:`,
                    value: `\`${dbc.get(`color`)}\` (Em HEX)`
                }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
            let emjnam = dbep.get(`11`)
            let emjvol = dbep.get(`29`)
            let emjava = dbep.get(`12`)
            let emjcor = dbep.get(`7`)
            let emjemo = dbep.get(`19`)

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_bot_nome`)
                .setLabel(`Alterar Nome`)
                .setEmoji(emjnam),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_bot_avatar`)
                .setLabel(`Alterar Avatar`)
                .setEmoji(emjava),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_bot_cor`)
                .setLabel(`Alterar Cor`)
                .setEmoji(emjcor),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_bot_emoji`)
                .setLabel(`Alterar Emojis`)
                .setEmoji(emjemo),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_voltar`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol),
            )
            await interaction.update({ content: ``, embeds: [embed], components: [row]})
        }
        if (interaction.customId === "config_bot_nome") {
            const modal = new ModalBuilder()
            .setCustomId("modalconfigname")
            .setTitle("Alterar nome do BOT");
            const text = new TextInputBuilder()
            .setCustomId("text")
            .setLabel("Qual sera o novo nome do bot?")
            .setStyle(1)
            .setPlaceholder("Coloque o nome que você deseja")
            .setRequired(true)

            modal.addComponents(new ActionRowBuilder().addComponents(text))
            await interaction.showModal(modal)
        }
        if (interaction.customId === "config_bot_avatar") {
            const modal = new ModalBuilder()
            .setCustomId("modalconfigavatar")
            .setTitle("Alterar avatar do BOT");
            const text = new TextInputBuilder()
            .setCustomId("text")
            .setLabel("Qual sera o novo avatar do bot?")
            .setStyle(1)
            .setPlaceholder("Coloque a url que você deseja")
            .setRequired(true)

            modal.addComponents(new ActionRowBuilder().addComponents(text))
            await interaction.showModal(modal)
        }
        if (interaction.customId === "config_bot_cor") {
            const modal = new ModalBuilder()
            .setCustomId("modalconfigcor")
            .setTitle("Alterar cor do BOT");
            const text = new TextInputBuilder()
            .setCustomId("text")
            .setLabel("Qual sera a nova cor do bot?")
            .setStyle(1)
            .setPlaceholder("Ex: #ff00b4")
            .setRequired(true)

            modal.addComponents(new ActionRowBuilder().addComponents(text))
            await interaction.showModal(modal)
        }
        if (interaction.customId === "config_bot_emoji") {
            var emojis = '';
            dbe.all().map((entry, index) => {emojis += `${index +1} - ${entry.data}\n`;});
            const Embed = new EmbedBuilder()
            .setAuthor({ name: `Configurando Emojis`, iconURL: interaction.guild.iconURL({ dynamic: true})})
            .setDescription(`Selecione abaixo qual opção deseja alterar em seus emojis. É importante que você preste atenção nas configurações atuais para garantir que suas alterações sejam feitas corretamente.\n\n${emojis}`)
            .setColor(dbc.get(`color`))
            let emjvol = dbep.get(`29`)
            const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_bot_emoji_id`)
                .setLabel(`Editar Emoji`)
                .setEmoji("✏"),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_bot`)
                .setEmoji(emjvol)
            )
            await interaction.update({content: ``, embeds: [Embed], components: [row1]})
        }
        if (interaction.customId === "config_bot_emoji_id") {
            const modal = new ModalBuilder()
            .setCustomId("modalconfigemoji")
            .setTitle("Alterar os emojis do BOT");
            const text = new TextInputBuilder()
            .setCustomId("text")
            .setLabel("Digite o id do emoji.")
            .setStyle(1)
            .setPlaceholder("Coloque o id do emoji aqui")
            .setRequired(true)

            modal.addComponents(new ActionRowBuilder().addComponents(text))
            await interaction.showModal(modal)
        }
        if(interaction.isModalSubmit() && interaction.customId === "modalconfigemoji") {
            const text = interaction.fields.getTextInputValue("text");
            const emojiantigo = `${dbe.get(`${text}`)}`;

            if (!isNaN(text)) {
                if (dbe.has(text)) {
                    const embed = new EmbedBuilder()
                    .setTitle(`Configurando Emojis`)
                    .setDescription(`${dbe.get(`16`)} | Envie abaixo o emoji que deseja substituir o emoji ${emojiantigo} (\`${text}\`), lembrando o BOT precisa estar no servidor em qual este emoji vai estar.`)
                    await interaction.update({embeds: [embed], components: []}).then(msg => {
                        const filter = m => m.author.id === interaction.user.id;
                        const collector = interaction.message.channel.createMessageCollector({ filter, max: 1 });
                        collector.on("collect", async(message) => {
                            message.delete()
                            const newt = message.content

                            const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

                            if (emojiRegex.test(newt) || newt.startsWith("<")) {
                                dbe.set(`${text}`, newt)
                                var emojis = '';
                                dbe.all().map((entry, index) => {emojis += `${index +1} - ${entry.data}\n`;});
                                const Embed = new EmbedBuilder()
                                .setAuthor({ name: `Configurando Emojis`, iconURL: interaction.guild.iconURL({ dynamic: true})})
                                .setDescription(`Selecione abaixo qual opção deseja alterar em seus emojis. É importante que você preste atenção nas configurações atuais para garantir que suas alterações sejam feitas corretamente.\n\n${emojis}`)
                                .setColor(dbc.get(`color`))
                                let emjvol = dbep.get(`29`)
                                const row1 = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`config_bot_emoji_id`)
                                    .setLabel(`Editar Emoji`)
                                    .setEmoji("✏"),
                                    new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`config_bot`)
                                    .setEmoji(emjvol)
                                )
                                msg.edit({ embeds: [Embed], components: [row1]})
                                
                                interaction.followUp({ content: `${dbe.get(`6`)} | O emoji ${emojiantigo} (\`${text}\`) foi alterado para ${dbe.get(`${text}`)}`, ephemeral:true})
                            } else {
                                var emojis = '';
                                dbe.all().map((entry, index) => {emojis += `${index +1} - ${entry.data}\n`;});
                                const Embed = new EmbedBuilder()
                                .setAuthor({ name: `Configurando Emojis`, iconURL: interaction.guild.iconURL({ dynamic: true})})
                                .setDescription(`Selecione abaixo qual opção deseja alterar em seus emojis. É importante que você preste atenção nas configurações atuais para garantir que suas alterações sejam feitas corretamente.\n\n${emojis}`)
                                .setColor(dbc.get(`color`))
                                let emjvol = dbep.get(`29`)
                                const row1 = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`config_bot_emoji_id`)
                                    .setLabel(`Editar Emoji`)
                                    .setEmoji("✏"),
                                    new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`config_bot`)
                                    .setEmoji(emjvol)
                                )
                                msg.edit({ embeds: [Embed], components: [row1]})
                                interaction.followUp({ content: `${dbe.get(`13`)} | Mande um emoji válido!`, ephemeral:true})
                            }
                            
                        })
                    })
                } else {
                    interaction.reply({content: `${dbe.get(`13`)} | ID Inválido!`, ephemeral:true})
                }
            } else {
                interaction.reply({content: `${dbe.get(`13`)} | ID Inválido!`, ephemeral:true})
            }
        }
        if(interaction.isModalSubmit() && interaction.customId === "modalconfigname") {
            const text = interaction.fields.getTextInputValue("text");

            interaction.client.user.setUsername(`${text}`)


            
            const embed = new EmbedBuilder()
            .setAuthor({ name: "Configurando Bot", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
            .setColor(dbc.get("color"))
            .setDescription(`Olá ${interaction.user} 👋.\n- Configure o seu bot e veja algumas informações abaixo.`)
            .addFields(
                {
                    name: `Nome do Bot:`,
                    value: `${text}`,
                    inline:true
                },
                {
                    name: "Avatar do Bot:",
                    value: `[Clique aqui para ver!](${interaction.client.user.displayAvatarURL({ dynamic: true })})`,
                    inline:true
                },
                {
                    name: `Cor Atual:`,
                    value: `\`${dbc.get(`color`)}\` (Em HEX)`
                }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
            let emjnam = dbep.get(`11`)
            let emjvol = dbep.get(`29`)
            let emjava = dbep.get(`12`)
            let emjcor = dbep.get(`7`)
            let emjemo = dbep.get(`19`)

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_bot_nome`)
                .setLabel(`Alterar Nome`)
                .setEmoji(emjnam),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_bot_avatar`)
                .setLabel(`Alterar Avatar`)
                .setEmoji(emjava),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_bot_cor`)
                .setLabel(`Alterar Cor`)
                .setEmoji(emjcor),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId(`config_bot_emojis`)
                .setLabel(`Alterar Emojis`)
                .setEmoji(emjemo),
                new ButtonBuilder()
                .setStyle(1)
                .setCustomId(`config_voltar`)
                .setLabel(`Voltar`)
                .setEmoji(emjvol),
            )
            await interaction.update({ content: ``, embeds: [embed], components: [row]})
            interaction.followUp({ content: `${dbe.get(`6`)} | Nome Alterada!`, ephemeral:true})
        }
        if(interaction.isModalSubmit() && interaction.customId === "modalconfigavatar") {
            const text = interaction.fields.getTextInputValue("text");

            if (text.startsWith('https')) {
                interaction.client.user.setAvatar(`${text}`)

            
                const embed = new EmbedBuilder()
                .setAuthor({ name: "Configurando Bot", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                .setColor(dbc.get("color"))
                .setDescription(`Olá ${interaction.user} 👋.\n- Configure o seu bot e veja algumas informações abaixo.`)
                .addFields(
                    {
                        name: `Nome do Bot:`,
                        value: `${interaction.client.user.username}`,
                        inline:true
                    },
                    {
                        name: "Avatar do Bot:",
                        value: `[Clique aqui para ver!](${text})`,
                        inline:true
                    },
                    {
                        name: `Cor Atual:`,
                        value: `\`${dbc.get(`color`)}\` (Em HEX)`
                    }
                )
                .setThumbnail(text)
                let emjnam = dbep.get(`11`)
                let emjvol = dbep.get(`29`)
                let emjava = dbep.get(`12`)
                let emjcor = dbep.get(`7`)
                let emjemo = dbep.get(`19`)
    
                const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_bot_nome`)
                    .setLabel(`Alterar Nome`)
                    .setEmoji(emjnam),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_bot_avatar`)
                    .setLabel(`Alterar Avatar`)
                    .setEmoji(emjava),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_bot_cor`)
                    .setLabel(`Alterar Cor`)
                    .setEmoji(emjcor),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_bot_emojis`)
                    .setLabel(`Alterar Emojis`)
                    .setEmoji(emjemo),
                    new ButtonBuilder()
                    .setStyle(1)
                    .setCustomId(`config_voltar`)
                    .setLabel(`Voltar`)
                    .setEmoji(emjvol),
                )
                await interaction.update({ content: ``, embeds: [embed], components: [row]})
                interaction.followUp({ content: `${dbe.get(`6`)} | Avatar Alterado!`, ephemeral:true})
            } else {
                interaction.reply({ content: `${dbe.get(`13`)} | Coloque um link válido!`, ephemeral:true})
            }
        }
        if (interaction.isModalSubmit() && interaction.customId === "modalconfigcor") {
            const text = interaction.fields.getTextInputValue("text");

            if (text.startsWith("#")) {
                dbc.set(`color`, text)

            
                const embed = new EmbedBuilder()
                .setAuthor({ name: "Configurando Bot", iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                .setColor(dbc.get("color"))
                .setDescription(`Olá ${interaction.user} 👋.\n- Configure o seu bot e veja algumas informações abaixo.`)
                .addFields(
                    {
                        name: `Nome do Bot:`,
                        value: `${interaction.client.user.username}`,
                        inline:true
                    },
                    {
                        name: "Avatar do Bot:",
                        value: `[Clique aqui para ver!](${interaction.client.user.displayAvatarURL({ dynamic: true })})`,
                        inline:true
                    },
                    {
                        name: `Cor Atual:`,
                        value: `\`${dbc.get(`color`)}\` (Em HEX)`
                    }
                )
                .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                let emjnam = dbep.get(`11`)
                let emjvol = dbep.get(`29`)
                let emjava = dbep.get(`12`)
                let emjcor = dbep.get(`7`)
                let emjemo = dbep.get(`19`)
    
                const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_bot_nome`)
                    .setLabel(`Alterar Nome`)
                    .setEmoji(emjnam),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_bot_avatar`)
                    .setLabel(`Alterar Avatar`)
                    .setEmoji(emjava),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_bot_cor`)
                    .setLabel(`Alterar Cor`)
                    .setEmoji(emjcor),
                    new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`config_bot_emojis`)
                    .setLabel(`Alterar Emojis`)
                    .setEmoji(emjemo),
                    new ButtonBuilder()
                    .setStyle(1)
                    .setCustomId(`config_voltar`)
                    .setLabel(`Voltar`)
                    .setEmoji(emjvol),
                )
                await interaction.update({ content: ``, embeds: [embed], components: [row]})
                interaction.followUp({ content: `${dbe.get(`6`)} | Cor Alterada!`, ephemeral:true})
            } else {
                interaction.reply({ content: `${dbe.get(`13`)} | Cor inválida!`, ephemeral:true})
            }
        }
        if(interaction.isModalSubmit() && interaction.customId === "modalconfigstatus") {
            const text = interaction.fields.getTextInputValue("presence");
            const text1 = interaction.fields.getTextInputValue("atividade");
            const text2 = interaction.fields.getTextInputValue("text_ativd");
            const url = interaction.fields.getTextInputValue("url") || "https://www.twitch.tv/discord";
          
            const statusMap = {
                "online": "online",
                "ausente": "idle",
                "ocupado": "dnd",
                "invisivel": "invisible",
            };
          
            const activityMap = {
                "jogando": "Playing",
                "assistindo": "Watching",
                "competindo": "Competing",
                "transmitindo": "Streaming",
                "ouvindo": "Listening"
            };
            if(Object.keys(statusMap).includes(text.toLowerCase()) && Object.keys(activityMap).includes(text1.toLowerCase())) {
                
                if(text1.toLowerCase() === "transmitindo") {
                    try{
                        interaction.client.user.setPresence({
                            activities: [{
                                name: `${text2}`,
                                type: Discord.ActivityType[activityMap[text1.toLowerCase()]],
                                url: url
                            }]
                        })
                
                        interaction.client.user.setStatus(statusMap[text.toLowerCase()]);
                        interaction.reply({
                            content:"Status Alterado com sucesso!",
                            ephemeral:true
                        })
                    } catch(err){
                        console.log(err)
                            interaction.reply({
                            content:"Ocorreu um erro ao tentar mudar os status do bot",
                            ephemeral:true
                            })
                    }
                } else {
                    try{
                    
                    interaction.client.user.setPresence({
                        activities: [{
                            name: `${text2}`,
                            type: Discord.ActivityType[activityMap[text1.toLowerCase()]],
                        }]
                    })
                    interaction.client.user.setStatus(statusMap[text.toLowerCase()]);
                    interaction.reply({
                        content:"Status Alterado com sucesso!",
                        ephemeral:true
                    })
                    } catch(err){
                        console.log(err)
                        interaction.reply({
                            content:"Ocorreu um erro ao tentar mudar os status do bot",
                            ephemeral:true
                        })
                    }
                }
            } else {
                interaction.reply({content:"Desculpe, mas a atividade fornecida não é válida. Por favor, forneça uma das seguintes atividades: jogando, assistindo, competindo, transmitindo, ouvindo.", ephemeral:true});
            }
            
        } 

    }
}