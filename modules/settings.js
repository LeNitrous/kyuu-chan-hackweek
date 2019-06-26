module.exports = {
    run: (client, message, args) => {
        var settings = client.setting.get(message.guild.id);
        var keys = {
            "Season": `${settings.quizAnimeSeason.charAt(0).toUpperCase() + settings.quizAnimeSeason.slice(1)} ${settings.quizAnimeYear}`,
            "Max Rounds": settings.quizRounds,
            "Guess Time": settings.quizRoundLength
        }
        message.channel.send(`__Current quiz settings:__\n${Object.keys(keys).map(key => `:black_small_square: ${key}: ${keys[key]}`).join('\n')}`);
    }
}