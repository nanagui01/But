const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder} = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbp = new JsonDatabase({ databasePath: "./json/personalizados.json"})
const dbu = new JsonDatabase({ databasePath: "./json/rankUsers.json"})
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json"})
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json"})
const Discord = require("discord.js")
const db = new JsonDatabase({ databasePath: "./json/produtos.json"})
const dbep = new JsonDatabase({ databasePath: "./json/emojisGlob.json"})
module.exports = {
    name: "ready",
    run: async (client) => {
        setInterval(async() => {
            // Hierarquia
            if (dbc.get(`hierarquia.sistema`) === "ON") {
                client.guilds.cache.forEach(async (guild) => {
                    await Promise.all(dbu.all().map(async (entry) => {
                        const user = guild.members.cache.get(entry.ID); // Acesso ao usuário no servidor
                        const userId = entry.ID;
            
                        if (user) {
                            let bestMatchCargo = null; // Armazena o cargo com o valor de compras mais próximo abaixo do valor gasto
                            let closestValue = -Infinity; // Armazena o valor de compras mais próximo
            
                            // Primeiro, lê todos os cargos e determina o mais próximo
                            await Promise.all(dbc.get(`hierarquia.cargos`).map(async (cargos) => {
                                const cargo = guild.roles.cache.get(cargos.cargo);
                                if (cargo) {
                                    const valorgasto = entry.data.gastosaprovados;
                                    const valorcomprasNecessario = parseFloat(cargos.valorcompras);
            
                                    // Verifica se o valor gasto aprovado é suficiente e é o mais próximo abaixo
                                    if (valorgasto >= valorcomprasNecessario && valorcomprasNecessario > closestValue) {
                                        closestValue = valorcomprasNecessario;
                                        bestMatchCargo = cargo;
                                    }
                                }
                            }));
            
                            if (bestMatchCargo) {
                                // Remove todos os cargos do usuário se o sistema de remoção estiver ativado
                                if (dbc.get('hierarquia.tirarcargo') === "ON") {
                                    await Promise.all(user.roles.cache.map(async (role) => {
                                        const isRoleDefined = dbc.get(`hierarquia.cargos`).some(cargos => cargos.cargo === role.id);
                                        if (isRoleDefined && role.id !== bestMatchCargo.id) {
                                            await user.roles.remove(role); // Remove o cargo
                                        }
                                    }));
                                }
            
                                // Adiciona o novo cargo, se não tiver
                                if (!user.roles.cache.has(bestMatchCargo.id)) {
                                    await user.roles.add(bestMatchCargo).catch(() => {}) // Adiciona o cargo
                                }
                            }
                        }
                    }));
                });
            }
            
            // Auto Mensagem
            if (dbc.get('automsg.sistema') === "ON") {
                const canais = dbc.get('automsg.canais');
            
                // Função para apagar a mensagem com verificação
                async function deleteOldMessage(msg) {
                    let messageDeleted = false;
                    
                    while (!messageDeleted) {
                        try {
                            await msg.delete();  // Tenta apagar a mensagem
                            messageDeleted = true;  // Se apagar, define como sucesso
                        } catch (error) {
                        }
                    }
                }
            
                // Função para enviar uma nova mensagem
                async function sendNewMessage(canal, entry) {
                    const newMsg = await canal.send({
                        content: `${entry.msg}`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId("teste")
                                    .setDisabled(true)
                                    .setStyle(2)
                                    .setLabel("Mensagem Automática")
                                    .setEmoji(dbep.get(`5`))
                            )
                        ]
                    });
                    entry.idmsg = newMsg.id;  // Atualiza o ID da nova mensagem
                    entry.time = 1;  // Reseta o tempo
                }
            
                // Função principal que processa o canal
                async function processChannel(entry, guild) {
                    const canal = guild.channels.cache.get(entry.id);
            
                    if (canal) {
                        try {
                            const msg = await canal.messages.fetch(entry.idmsg);  // Busca a mensagem antiga
            
                            if (entry.time >= entry.tempo) {
                                await deleteOldMessage(msg);  // Apaga a mensagem antiga com verificação
                                await sendNewMessage(canal, entry);  // Envia a nova mensagem
                            } else {
                                entry.time += 1;  // Incrementa o contador de tempo
                            }
            
                        } catch (error) {
                            // Caso a mensagem não exista ou erro ocorra, envia uma nova
                            console.log("Erro ao buscar a mensagem, enviando nova:", error);
                            await sendNewMessage(canal, entry);
                        }
            
                        dbc.set('automsg.canais', canais);  // Salva no banco de dados
                    }
                }
            
                client.guilds.cache.forEach(guild => {
                    canais.forEach(async entry => {
                        await processChannel(entry, guild);
                    });
                });
            }
            

            // Auto Repost
            if (dbc.get(`autorepost.sistema`) === "ON") {
                const horarioFornecido = dbc.get(`autorepost.hr`)

                const agora = new Date();
                const horaAtual = agora.getHours();
                const minutoAtual = agora.getMinutes();
                const [horaFornecida, minutoFornecido] = horarioFornecido.split(':').map(Number);
                
                if (horaFornecida === horaAtual && minutoFornecido === minutoAtual) {
                    let paneis = await db.all()
                    client.guilds.cache.forEach(guild => {
                        for (const x of paneis) {
                            const channel = guild.channels.cache.get(x.data.idchannel)
                            if (channel) {
                                console.log("Auto Repost resetando")
                                channel.messages.fetch(x.data.idmsg).then(async(msg) => {
                                    if (x.data.produtos.length === 1) {
                                        if (dbp.get(`modo`) === "embed") {
                                            const dataa = x.data.button || {}
                                            const embed = new EmbedBuilder()
                                            .setFooter({ text: guild.name, iconURL: guild.iconURL({ dynamic:true })})
                                            .setTimestamp()
                                            let titulo = dbp.get(`painel_button.titulo`);
                                            titulo = titulo.replace("{nome}", x.data.titulo)
                                            titulo = titulo.replace("{valor}", Number(x.data.produtos[0].preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                                            titulo = titulo.replace("{estoque}", x.data.produtos[0].estoque.length)
                                            let desc = dbp.get(`painel_button.msg`);
                                            desc = desc.replace("{nome}", x.data.titulo)
                                            desc = desc.replace("{valor}", Number(x.data.produtos[0].preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                                            desc = desc.replace("{estoque}", x.data.produtos[0].estoque.length)
                                            desc = desc.replace("{desc}", x.data.desc)
                                            embed.setTitle(titulo)
                                            embed.setDescription(desc)
                                            embed.setColor(dataa.color || dbc.get(`color`))
                                            if (x.data.banner) {
                                                embed.setImage(x.data.banner)
                                            }
                                            if (x.data.thumb) {
                                                embed.setThumbnail(x.data.thumb)
                                            }
                                            
                                            const button = new ButtonBuilder()
                                            .setStyle(dbp.get(`painel_button.button.style`))
                                            .setCustomId(`${x.data.id}_${x.data.produtos[0].nome}_produtopainel`)
                                            .setLabel(`${dbp.get(`painel_button.button.text`)}`)
                
                                            if (dbp.get(`painel_button.button.emoji`)) {
                                                button.setEmoji(dbp.get(`painel_button.button.emoji`))
                                            }
                                            const row = new ActionRowBuilder()
                                            .addComponents(button)
                                            await msg.delete()
                                            await channel.send({ embeds: [embed], components: [row], content: "", files: []}).then(msg => {
                                                db.set(`${x.data.id}.idmsg`, `${msg.id}`)
                                                db.set(`${x.data.id}.idchannel`, `${msg.channel.id}`)
                                            })
                                        } else {
                                            let desc = dbp.get(`painel_button.msg`);
                                            desc = desc.replace("{nome}", x.data.titulo)
                                            desc = desc.replace("{valor}", Number(x.data.produtos[0].preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                                            desc = desc.replace("{estoque}", x.data.produtos[0].estoque.length)
                                            desc = desc.replace("{desc}", x.data.desc)
                                            const button = new ButtonBuilder()
                                            .setStyle(dbp.get(`painel_button.button.style`))
                                            .setCustomId(`${x.data.id}_${x.data.produtos[0].nome}_produtopainel`)
                                            .setLabel(`${dbp.get(`painel_button.button.text`)}`)
                                            if (dbp.get(`painel_button.button.emoji`)) {
                                                button.setEmoji(dbp.get(`painel_button.button.emoji`))
                                            }
                                            const row = new ActionRowBuilder()
                                            .addComponents(button)
                                            const options = { embeds: [], components: [row], content: desc, files: []}
                                            let banner;
                                            if (x.data.banner) {
                                                banner = x.data.banner
                                                options.files = [banner]
                                            }
                                            await msg.delete()
                                            await channel.send(options).then(msg => {
                                                db.set(`${x.data.id}.idmsg`, `${msg.id}`)
                                                db.set(`${x.data.id}.idchannel`, `${msg.channel.id}`)
                                            })
                                        }
                                    } else if (x.data.produtos.length > 1) {
                                        if (dbp.get(`modo`) === "embed") {
                                            const dataa = x.data.button || {}
                                            const embed = new EmbedBuilder()
                                            .setFooter({ text: guild.name, iconURL: guild.iconURL({ dynamic:true })})
                                            .setTimestamp()
                                            let titulo = dbp.get(`painel_select.titulo`);
                                            titulo = titulo.replace("{nome}", x.data.titulo)
                                            let desc = dbp.get(`painel_select.msg`);
                                            desc = desc.replace("{nome}", x.data.titulo)
                                            desc = desc.replace("{desc}", x.data.desc)
                                            embed.setTitle(titulo)
                                            embed.setDescription(desc)
                                            embed.setColor(dataa.color || dbc.get(`color`))
                                            if (x.data.banner) {
                                                embed.setImage(x.data.banner)
                                            }
                                            if (x.data.thumb) {
                                                embed.setThumbnail(x.data.thumb)
                                            }
                                            
                                            const actionrowselect = new StringSelectMenuBuilder()
                                            .setCustomId(x.data.id)
                                            .setPlaceholder(dbp.get(`painel_select.select.place`))
                                            
                                            for (const c of x.data.produtos){
                                                let titulo = dbp.get(`painel_select.select.text`);
                                                titulo = titulo.replace("{nome}", c.nome)
                                                titulo = titulo.replace("{valor}", Number(c.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                                                titulo = titulo.replace("{estoque}", c.estoque.length)
                                                let desc = dbp.get(`painel_select.select.desc`);
                                                desc = desc.replace("{nome}", c.nome)
                                                desc = desc.replace("{desc}", c.desc)
                                                desc = desc.replace("{valor}", Number(c.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                                                desc = desc.replace("{estoque}", c.estoque.length)
                                                actionrowselect.addOptions(
                                                    {
                                                        label: `${titulo}`,
                                                        description: `${desc}`,
                                                        value: `${c.nome}`
                                                    }
                                                )
                                            }
                                            const row = new ActionRowBuilder()
                                            .addComponents(actionrowselect)
                                            await msg.delete()
                                            await channel.send({ embeds: [embed], components: [row], content: "", files: []}).then(msg => {
                                                db.set(`${x.data.id}.idmsg`, `${msg.id}`)
                                                db.set(`${x.data.id}.idchannel`, `${msg.channel.id}`)
                                            })
                                        } else {
                                            let desc = dbp.get(`painel_select.msg`);
                                            desc = desc.replace("{nome}", x.data.titulo)
                                            desc = desc.replace("{desc}", x.data.desc)
                                            const actionrowselect = new StringSelectMenuBuilder()
                                            .setCustomId(x.data.id)
                                            .setPlaceholder(dbp.get(`painel_select.select.place`))
                                            
                                            for (const c of x.data.produtos){
                                                let titulo = dbp.get(`painel_select.select.text`);
                                                titulo = titulo.replace("{nome}", c.nome)
                                                titulo = titulo.replace("{valor}", Number(c.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                                                titulo = titulo.replace("{estoque}", c.estoque.length)
                                                let desc = dbp.get(`painel_select.select.desc`);
                                                desc = desc.replace("{nome}", c.nome)
                                                desc = desc.replace("{desc}", c.desc)
                                                desc = desc.replace("{valor}", Number(c.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                                                desc = desc.replace("{estoque}", c.estoque.length)
                                                actionrowselect.addOptions(
                                                    {
                                                        label: `${titulo}`,
                                                        description: `${desc}`,
                                                        value: `${c.nome}`
                                                    }
                                                )
                                            }
                                            const row = new ActionRowBuilder()
                                            .addComponents(actionrowselect)
                                            const options = { embeds: [], components: [row], content: desc, files: []}
                                            let banner;
                                            if (x.data.banner) {
                                                banner = x.data.banner
                                                options.files = [banner]
                                            }
                                            await msg.delete()
                                            await channel.send(options).then(msg => {
                                                db.set(`${x.data.id}.idmsg`, `${msg.id}`)
                                                db.set(`${x.data.id}.idchannel`, `${msg.channel.id}`)
                                            })
                                        }
                                    }
                                }).catch(err => {
                                    console.log(err)
                                })
                            }
                        }
                    })
                }
            }

            // Auto Lock

            if (dbc.get(`autolock.sistema`) === "ON") {
                const horarioFornecido = dbc.get(`autolock.hr1`)

                const [horaFornecida, minutoFornecido] = horarioFornecido.split(':').map(Number);

                const formatter = new Intl.DateTimeFormat('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const [horaAtual, minutoAtual] = formatter.formatToParts(new Date())
                    .reduce((acc, { type, value }) => {
                        if (type === 'hour') acc[0] = Number(value);
                        if (type === 'minute') acc[1] = Number(value);
                        return acc;
                    }, [0, 0]);
                
                
                if (horaFornecida === horaAtual && minutoFornecido === minutoAtual) {
                    client.guilds.cache.forEach(guild => {
                        if (dbc.get(`autolock.sistema`) !== "ON") return;
                        guild.channels.cache.forEach(channel => {
                            dbc.get(`autolock.canais`).map(async(entry) => {
                                if (entry === channel.id) {
                                    await channel.permissionOverwrites.edit(guild.roles.everyone, {
                                        SendMessages: false
                                    })
                                    let messagesDeleted = 0;
                                    let fetched;
                                    do {
                                        fetched = await channel.messages.fetch({ limit: 100 });
                                        messagesDeleted += fetched.size;
                                        await channel.bulkDelete(fetched);
                                    } while (fetched.size >= 2);
    
                                    
                                    const embed1 = new EmbedBuilder()
                                    .setAuthor({ name: `Limpeza Feita! 🧹`, iconURL: guild.iconURL()})
                                    .setDescription(`Um total de \`${messagesDeleted}\` mensagens removidas.`)
                                    .setColor(dbc.get(`color`))
    
                                    const embed = new EmbedBuilder()
                                    .setColor(dbc.get(`color`))
                                    .setDescription(`Este canal foi bloqueado automaticamente pelo o sistema!\n- O canal será liberado às ${dbc.get('autolock.hr2').split(':')[0] < 12 ? `**__${dbc.get('autolock.hr2')}__** da manhã` : dbc.get('autolock.hr2').split(':')[0] >= 12 && dbc.get('autolock.hr2').split(':')[0] < 18 ? `**__${dbc.get('autolock.hr2')}__** da tarde` : `**__${dbc.get('autolock.hr2')}__** da noite`}.`)
                                    .setTimestamp();
    
                                    await channel.send({
                                        embeds: [embed1, embed],
                                        components: [
                                            new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder()
                                                        .setLabel("Mensagem do Sistema (Auto Lock)")
                                                        .setCustomId("disabledButton")
                                                        .setStyle("2")
                                                        .setDisabled(true),
                                                )
                                        ]
                                    });
                                }
                            })
                        });
                    });
                }
    
                const hrf = dbc.get(`autolock.hr2`)
    
                const [hfa, mfa] = hrf.split(':').map(Number);
                
                if (hfa === horaAtual && mfa === minutoAtual) {
                    client.guilds.cache.forEach(guild => {
                        if (dbc.get(`autolock.sistema`) !== "ON") return;
                        guild.channels.cache.forEach(channel => {
                            dbc.get(`autolock.canais`).map(async(entry) => {
                                if (entry === channel.id) {
                                    await channel.permissionOverwrites.edit(guild.roles.everyone, {
                                        SendMessages: true
                                    });
                                    let messagesDeleted = 0;
                                    let fetched;
                                    do {
                                        fetched = await channel.messages.fetch({ limit: 100 });
                                        messagesDeleted += fetched.size;
                                        await channel.bulkDelete(fetched);
                                    } while (fetched.size >= 2);
    
                                    const embed = new EmbedBuilder()
                                    .setColor(dbc.get(`color`))
                                    .setAuthor({ name: `Canal Desbloqueado! ✅`, iconURL: guild.iconURL()})
                                    .setDescription(`Este canal foi desbloqueado automaticamente pelo o sistema!`)
                                    .setTimestamp();
    
                                    await channel.send({
                                        embeds: [embed],
                                        components: [
                                            new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder()
                                                        .setLabel("Mensagem do Sistema (Auto Lock)")
                                                        .setCustomId("disabledButton")
                                                        .setStyle("2")
                                                        .setDisabled(true),
                                                )
                                        ]
                                    });
                                }
                            })
                        });
                    });
                }
            }
            
        }, 60000);
    }
}