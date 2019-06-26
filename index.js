const Discord = require('discord.js');
const Enmap = require('enmap');
const fs = require('fs-extra');

const client = new Discord.Client();

client.config = require('./config.json');
client.modules = new Enmap();
client.setting = new Enmap('guilds');
client.development = process.env.NODE_ENV == 'dev';

client.defaults = {};
client.defaults.guildSettings = {
    _quizTextChannel: undefined,
    _quizVoiceChannel: undefined,
    _quizIsActive: false,
    quizAnimeYear: 2019,
    quizAnimeSeason: 'winter',
    quizRounds: 10,
    quizRoundLength: 20
};

client.activeGames = {}

client.on('ready', () => console.log(`The bot is now ready! ${(client.development) ? "and is running in developer mode." : ""}`));
client.on('message', (message) => {
    (async () => {
        if (message.author.bot)
        return;

        if (message.content.indexOf(client.config.bot_prefix) !== 0)
            return;

        const arg = message.content.slice(client.config.bot_prefix.length).trim().split(/ +/g);
        const cmd = arg.shift().toLowerCase();
        const command = client.modules.get(cmd);
        
        if (!command)
            return;

        if (command.admin && !message.member.roles.find(role => role.name == client.config.bot_adminRole))
            return;

        console.log(`[${message.guild.id}] ${message.author.username}#${message.author.discriminator}: ${cmd}`);

        await command.run(client, message, arg);
    })().catch(error => console.error(error));
});
client.on('guildCreate', (guild) => {
    if (client.setting.has(guild.id))
        return;

    console.log(`Joined new guild ${guild.name} (${guild.id}).`);

    client.setting.ensure(guild.id, client.defaults.guildSettings);
});

process.on('SIGINT', async () => {
    console.log("Shutting down...");
    await client.destroy();
    process.exit(0);
});

(async () => {
    var modules = await fs.readdir('./modules');
    modules.forEach(file => {
        if (!file.endsWith(".js"))
            return;

        let mod = require(`./modules/${file}`);
        let name = file.split(".")[0];
        client.modules.set(name, mod);

        console.log(`Loaded module: "${name}"`);
    });

    var events = await fs.readdir('./events');
    events.forEach(file => {
        if (!file.endsWith(".js"))
            return;

        let evt = require(`./events/${file}`);
        client.on(evt.event, evt.task.bind(null, client));
        delete require.cache[require.resolve(`./events/${file}`)];

        console.log(`Loaded event: "${file.split(".")[0]}"`);
    });

    await client.login(client.config.bot_token);
})().catch(error => console.error(error));
