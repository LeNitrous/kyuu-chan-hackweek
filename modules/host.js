exports.run = async (client) => {
    const setting = client.setting.get(message.guild.id);

    if (!setting._quizIsActive)
        return message.channel.send("There is no active game");

    await message.channel.send(`<@${client.activeGames[message.guild.id].host.id}> is currently hosting a game in <#${setting._quizTextChannel}>`);
}