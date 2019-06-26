module.exports = {
    run: (client, message, args) => {
        const keys = {
            "season": "",
            "rounds": "quizRounds",
            "timer": "quizRoundLength",
        };

        var prop = args.shift();
        var val = args.join(' ');

        if (!(prop in keys))
            return message.channel.send(`Invalid property. Changeable quiz settings: ${Object.keys(keys).join(", ")}`);

        var seasonRegex = /(winter|spring|summer|fall) (\d{4})/i;
        if (prop == "season" && !seasonRegex.test(val))
            return message.channel.send("Key `season` requires a valid format. Example: \"Spring 2019\"");
        else if (prop == "season") {
            var season = val.match(seasonRegex);
            client.setting.set(message.guild.id, season[1].toLowerCase(), "quizAnimeSeason");
            client.setting.set(message.guild.id, season[2], "quizAnimeYear");
            return message.channel.send(`\`season\` has been set to \`${val}\``);
        }

        if (prop == "rounds" && isNaN(val))
            return message.channel.send("Key `rounds` requires a number.");

        if (prop == "timer" && isNaN(val))
            return message.channel.send("Key `timer` requires a number.");

        client.setting.set(message.guild.id, val, keys[prop]);
        message.channel.send(`\`${prop}\` has been set to \`${val}\`.`);
    }
}