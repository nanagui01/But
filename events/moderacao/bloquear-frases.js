const natural = require("natural"); // Biblioteca para comparação de strings
const { JsonDatabase } = require("wio.db");
const { EmbedBuilder } = require("discord.js"); // Para criar o aviso

const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json" });
const dbe = new JsonDatabase({ databasePath: "./json/emojis.json" });

module.exports = {
  name: "messageCreate",
  run: async (message) => {
    if (!message.guild || message.author.bot) return; // Ignora DMs e bots

    const frasesProibidas = dbc.get("blockerFrases.frases"); // Carrega as frases proibidas
    const limiteSimilaridade = 0.7; // Define o limite de similaridade (0 a 1)

    // Verifica cada palavra da mensagem
    const palavrasMensagem = message.content.toLowerCase().split(/\s+/); // Divide a mensagem em palavras
    let fraseProibidaEncontrada = false;

    for (const palavra of palavrasMensagem) {
      for (const fraseProibida of frasesProibidas) {
        // Usa o algoritmo Jaro-Winkler para calcular a similaridade
        const similaridade = natural.JaroWinklerDistance(palavra, fraseProibida.toLowerCase());

        // Se a similaridade for maior ou igual ao limite, considera como proibida
        if (similaridade >= limiteSimilaridade) {
          fraseProibidaEncontrada = true;
          break;
        }
      }
      if (fraseProibidaEncontrada) break;
    }

    if (fraseProibidaEncontrada) {
      // Apaga a mensagem
      await message.delete().catch(console.error);

      // Envia um aviso temporário
      const aviso = await message.channel.send({ content: `${dbe.get("13")} **Atenção, ${message.author}!**\nSua mensagem foi apagada por conter uma frase proibida ou semelhante.` }).then((msg) => {
        setTimeout(() => {
            msg.delete().catch(console.error); // Ignora erros se a mensagem já tiver sido apagada
          }, 10000); // 10 segundos
      })
    }
  },
};
