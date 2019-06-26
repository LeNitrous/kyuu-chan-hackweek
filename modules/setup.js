module.exports = {
    admin: true,
    run: (client, message, args) => {
        if (!message.member.voiceChannelID)
            return message.reply("You must be in a voice channel to use this command!");

        client.setting.set(message.guild.id, message.channel.id, "_quizTextChannel");
        client.setting.set(message.guild.id, message.member.voiceChannelID, "_quizVoiceChannel");

        message.channel.send("Updated quiz channels.");
    }
}