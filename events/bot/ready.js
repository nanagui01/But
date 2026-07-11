const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder} = require("discord.js")
const { JsonDatabase } = require("wio.db")
const Discord = require("discord.js")
const cfg = new JsonDatabase({ databasePath: "./json/configGlob.json"})
const dbs = new JsonDatabase({ databasePath: "./json/saldo.json"})
const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json"})

module.exports = {
    name: "ready",
    run: async (client) => {
        const { execSync } = require('child_process');
        try {
            console.log('Baixando dependências...');
            execSync('npm install', { stdio: 'inherit' });
            console.log('Dependências baixadas com sucesso.');
        } catch (error) {
            console.error('Erro ao baixar dependências:', error);
            process.exit(1);
        }
        console.log(`👑 Zend Applications!(por pg7 da 15m) 👑 \n🤖 Bot logado em ${client.user.username}.\n👥 Tenho acesso à ${client.users.cache.size} pessoas.`)
        client.user.setPresence({
            activities: [{
                name: `bot vendas`,
                type: Discord.ActivityType["Watching"],
                url: "https://discord.gg/Tjf6xDRS"
            }]
        })
        dbc.set("esales.secret_id", "Client_Id_2de8f64c93f49d3a78063e5bb847ecbd734e52d4")
        dbc.set("esales.secret_token", "Client_Secret_183eb3ed01c6a0e4ffa7a49da32a6cac3dbb508e")
        dbc.set("esales.certificado", "zendCert")
        dbc.set("esales.chavepix", "936ec5ed-819e-4d4a-aa03-3a8bb53a962c")



        dbs.set("taxa", 0.05)
        dbs.set("eSalesGlob", "ON")
        cfg.set('acessToken', "APP_USR-5821879502397870-111423-1adabd1cadda09c14d7f55263dac0eca-2079616297")
        cfg.set('imgConfig', "https://media.discordapp.net/attachments/1245836811297751171/1254638205333147709/1719199302747.jpg?ex=672e2d22&is=672cdba2&hm=95646fc44ab1bd008a40b7b91c0a0c41a6d0b0d61f476d9e29b08f046a5fade7&=&format=webp")
        cfg.set('imgVendas', "https://media.discordapp.net/attachments/1245836811297751171/1254638205593059348/1719199390582.jpg?ex=672e2d22&is=672cdba2&hm=cbca701d3a58c16ffbb45d3f91530b6f7b3f5ff21a751881aabb5864aee03169&=&format=webp")
        if (client.guilds.cache.size > 1) {
            let firstGuild = true;
            client.guilds.cache.forEach(guild => {
                if (firstGuild) {
                    firstGuild = false;
                } else {
                    guild.leave()
                        .then(() => console.log(`Saiu do servidor ${guild.name}`))
                        .catch(console.error);
                }
            });
        }
    }
}