module.exports = {
    admin: true,
    run: (client, message, args) => {
        const keys = {
            "season": "quizAnimeSeason",
            "rounds": "quizAnimeRounds",
            "year": "quizAnimeYear",
        };
        const seasons = [ "winter", "spring", "summer", "fall" ]

        var prop = args[0].toLowerCase();
        var val = args[1].toLowerCase();

        if (!(prop in keys))
            return message.channel.send("Invalid property.");

        if (prop == "year" && isNaN(val))
            return message.channel.send("Key `year` requires a number");

        if (prop == "season" && !seasons.includes(val))
            return message.channel.send("Key `season` requires a valid season");

        if (prop == "rounds" && isNaN(val))
            return message.channel.send("Key `rounds` requires a number");

        client.setting.set(message.guild.id, keys[prop], val);
        message.channel.send(`\`${prop}\` has been set to \`${val}\``);
    }
}