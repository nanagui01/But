const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder} = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbp = new JsonDatabase({ databasePath: "./json/personalizados.json"})
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json"})
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json"})
const Discord = require("discord.js")
const db = new JsonDatabase({ databasePath: "./json/produtos.json"})
const dbep = new JsonDatabase({ databasePath: "./json/emojisGlob.json"})
module.exports = {
    name: "guildMemberAdd",
    run: async (client) => {
        const canal = client.guild.channels.cache.get(dbc.get("logs.entrada.entrou"))
        if (canal) {
            const member = client
            const nomeUsuario = member.user.username;
            const dataCriacao = new Date(member.user.createdAt.setHours(0, 0, 0, 0));
            const dataAtual = new Date();
            const diffEmMilissegundos = Math.abs(dataAtual - dataCriacao);
            const diffEmDias = Math.floor(diffEmMilissegundos / (1000 * 60 * 60 * 24));
            const tempoNoDiscord = `${diffEmDias} dias no Discord.`;

            let tipoLink = "Vanity URL ou convite de uso único.";
            if (nomeUsuario.includes(member.guild.name)) {
                tipoLink = "Vanity URL ou convite de uso único.";
            } else if (member.user.bot) {
                tipoLink = "Convite de bot";
            } else {
                if (nomeUsuario.match(/discord\.gg\/[a-zA-Z0-9]+/i)) {
                    tipoLink = "Convite personalizado.";
                } else if (nomeUsuario.match(/discord.com\/invite\/[a-zA-Z0-9]+/i)) {
                    tipoLink = "Convite personalizado.";
                } else if (nomeUsuario.match(/[a-zA-Z0-9]+#[0-9]{4}/)) {
                    tipoLink = "Convite direto de servidor.";
                }
            }

            const embed = new EmbedBuilder()
            .setAuthor({ name: `Novo Membro!`, iconURL: member.user.displayAvatarURL()})
            .setThumbnail(member.user.displayAvatarURL())
            .setColor("Green")
            .setFields(
                { name: `Usuário:`, value: `\`${member.user.username} - ${member.user.id}\``, inline:true },
                { name: `Tempo da conta:`, value: `${tempoNoDiscord}`, inline:true },
            )
            .setFooter({ text: `Servidor: ${client.guild.name}` })
            .setTimestamp()
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("teste")
                    .setDisabled(true)
                    .setStyle(2)
                    .setLabel("Mensagem Automática")
                    .setEmoji(dbep.get(`5`))
            );
            canal.send({ content: `${client.user}`, embeds: [embed], components: [row]})
        }
        //// Boas Vindas
        if (dbc.get(`boasvindas.sistema`) === "ON") {
            const canal = client.guild.channels.cache.get(dbc.get(`boasvindas.canal`))
            if (canal) {
                let mensagem = dbc.get(`boasvindas.msg`) || ""
                mensagem = mensagem.replace("{user}", client.user)
                mensagem = mensagem.replace("{user.id}", client.user.id)
                mensagem = mensagem.replace("{user.name}", client.user.username)

                if (mensagem) {
                    const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("teste")
                            .setDisabled(true)
                            .setStyle(2)
                            .setLabel("Mensagem Automática")
                            .setEmoji(dbep.get(`5`))
                    );
                    canal.send({ content: mensagem, components: [row] }).then((msg) => {
                        if (dbc.get(`boasvindas.tempo`)) {
                            setTimeout(() => {
                                msg.delete()
                            }, 1000 * Number(dbc.get(`boasvindas.tempo`)));
                        }
                    })
                }
            }
        }
        if (dbc.get(`autorole.sistema`) === "ON") {
            const cargosdb = dbc.get(`autorole.cargos`) || []
            await cargosdb.map(async(entry) => {
                const cargo = client.guild.roles.cache.get(entry)
                if (cargo) {
                    try {
                        await client.roles.add(cargo); // Adiciona o cargo ao novo membro
                        console.log(`Cargo ${cargo.name} adicionado ao usuário ${client.user.tag}`);
                    } catch (error) {
                        console.error(`Erro ao adicionar cargo ao usuário ${client.user.tag}:`, error);
                    }
                }
            })
        }
    }
                      }
