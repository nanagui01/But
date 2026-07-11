const fs = require("fs");

module.exports = {

  run: (client) => {

    //====Handler das Slahs====\\
    const SlashsArray = []

    fs.readdir(`./Comandos/`, (erro, pasta) => {
      pasta.forEach(subpasta => {
        fs.readdir(`./Comandos/${subpasta}/`, (erro, arquivos) => {
          arquivos.forEach(arquivo => {
            if (!arquivo?.endsWith('.js')) return;
            arquivo = require(`../Comandos/${subpasta}/${arquivo}`);
            if (!arquivo?.name) return;
            client.slashCommands.set(arquivo?.name, arquivo);
            SlashsArray.push(arquivo)
          });
        });
      });
    });

    client.on("ready", async () => {
      client.application.commands.set(SlashsArray).then(() => {
        console.log("✅ Comandos sincronizados com sucesso.")
      })

    })
  }
}

