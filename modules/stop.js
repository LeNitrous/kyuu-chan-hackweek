module.exports = {
    run: async (client, message, args) => {
        const setting = client.setting.get(message.guild.id);

        if (!setting._quizIsActive)
            return message.channel.send("There is no active game");

        if (message.channel.id !== setting._quizTextChannel)
            return message.channel.send(`Can only end the game in <#${setting._quizTextChannel}>! Use the command there again.`);

        if (client.activeGames[message.guild.id].host.id !== message.member.id || !message.member.roles.find(role => role.name == client.config.bot_adminRole))
            return message.channel.send("Only the host or admin can stop this game.");

        await client.activeGames[message.guild.id].end();
    }
}