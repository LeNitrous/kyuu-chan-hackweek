module.exports = {
    run: async (client, message, args) => {
        const setting = client.setting.get(message.guild.id);

        if (!setting._quizIsActive)
            return message.channel.send("There is no active game");

        if (message.channel.id !== setting._quizTextChannel)
            return message.channel.send(`Can only end the game in <#${setting._quizTextChannel}>! Use the command there again.`);

        await client.activeGames[message.guild.id].end();
    }
}