module.exports = {
    admin: true,
    run: (client, message, args) => {
        client.setting.set(message.guild.id, client.defaults.guildSettings);
        message.channel.send("Quiz settings have been reset.");
    }
}