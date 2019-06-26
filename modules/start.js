const GameManager = require('../game/manager');

exports.run = async (client, message) => {
    const setting = client.setting.get(message.guild.id);

    if (!message.guild.channels.has(setting._quizVoiceChannel) || !message.guild.channels.has(setting._quizTextChannel))
        return message.channel.send("Cannot start a game. Please setup your channels first.");

    if (setting._quizIsActive)
        return message.channel.send("Cannot start a game while there is one currently active.");

    if (message.channel.id !== setting._quizTextChannel)
        return message.channel.send(`Can only start the game in <#${setting._quizTextChannel}>! Use the command there again.`);

    var options = {
        voiceChannel: message.guild.channels.get(setting._quizVoiceChannel),
        textChannel: message.guild.channels.get(setting._quizTextChannel),
        token: client.config.google_token,
        debug: client.development,
        roundsMax: setting.quizRounds,
        roundLength: setting.quizRoundLength,
        client: client,
        message: message
    }

    client.activeGames[message.guild.id] = new GameManager(options);

    await client.activeGames[message.guild.id].init();
}