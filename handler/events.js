const fs = require('fs');
const path = require('path');

module.exports = {
    run: (client) => {
        // Lista todos os itens no diretório 'events'
        const items = fs.readdirSync('./events/');
        
        // Filtra apenas diretórios
        const directories = items.filter(item => fs.statSync(path.join('./events/', item)).isDirectory());

        directories.forEach(local => {
            // Lista todos os arquivos JavaScript dentro de cada diretório
            const eventFiles = fs.readdirSync(`./events/${local}`).filter(arquivo => arquivo.endsWith('.js'));
            for (const file of eventFiles) {
                const event = require(`../events/${local}/${file}`);

                if (event.once) {
                    client.once(event.name, (...args) => event.run(...args, client));
                } else {
                    client.on(event.name, (...args) => event.run(...args, client));
                }
            }
        });
    }
};
