const Discord = require("discord.js");
const express = require("express");


// =========================
// RENDER WEB SERVER
// =========================

const app = express();

app.get("/", (req, res) => {
    res.status(200).send("Bot online!");
});

app.get("/status", (req, res) => {
    res.json({
        status: "online",
        uptime: process.uptime()
    });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🌐 Web iniciado na porta ${PORT}`);
});


// =========================
// CLIENT DISCORD
// =========================

const client = new Discord.Client({

    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers
    ]

});


module.exports = client;

client.slashCommands = new Discord.Collection();


// =========================
// HANDLERS
// =========================

const events = require("./handler/events");
const slash = require("./handler/slash");


slash.run(client);
events.run(client);


// =========================
// INTERAÇÕES
// =========================

client.on("interactionCreate", async interaction => {


    if (interaction.isChatInputCommand()) {


        const command =
            client.slashCommands.get(interaction.commandName);


        if (!command)
            return;


        if(interaction.guild){

            interaction.member =
            await interaction.guild.members.fetch(
                interaction.user.id
            );

        }


        try {

            await command.run(
                client,
                interaction
            );


        } catch(error){

            console.error(
                "Erro comando:",
                error
            );


            if(!interaction.replied && !interaction.deferred){

                await interaction.reply({
                    content:
                    "❌ Ocorreu um erro ao executar o comando.",
                    ephemeral:true
                }).catch(()=>{});

            }

        }

    }



    if(interaction.isAutocomplete()){


        const command =
        client.slashCommands.get(
            interaction.commandName
        );


        if(!command?.autocomplete)
            return;


        try{

            await command.autocomplete(
                interaction
            );

        }catch(error){

            console.log(
                "Autocomplete erro:",
                error
            );

        }

    }

});



// =========================
// ERROS
// =========================

process.on(
    "unhandledRejection",
    error =>
    console.log(
        "Unhandled:",
        error
    )
);


process.on(
    "uncaughtException",
    error =>
    console.log(
        "Exception:",
        error
    )
);



// =========================
// LOGIN
// =========================

client.login(process.env.TOKEN)
.then(()=>{

    console.log(
        `🤖 Logado como ${client.user.tag}`
    );

})
.catch(error=>{

    console.error(
        "Erro no login:",
        error
    );

});