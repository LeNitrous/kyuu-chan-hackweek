const { Mal } = require('node-myanimelist');
const Promise = require('bluebird');
const youtubeDownload = require('ytdl-core-discord');
const youtubeSearchApi = require('simple-youtube-api');

exports.run = async (client, message) => {
    const setting = client.setting.get(message.guild.id);

    if (!message.guild.channels.has(setting.quizVoiceChannel) || !message.guild.channels.has(setting.quizTextChannel))
        return message.channel.send("Cannot start a game. Please setup your channels first.");

    if (message.channel.id !== setting.quizTextChannel)
        return message.channel.send(`Can only start the game in <#${setting.quizTextChannel}>! Use the command there again.`);

    var season = require('../test/season.json'); // await Mal.season(setting.animeYear, setting.animeSeason);

    var options = {
        voiceChannel: message.guild.channels.get(setting.quizVoiceChannel),
        textChannel: message.guild.channels.get(setting.quizTextChannel),
        list: season.anime.filter(show => show.type == "TV" && show.kids == false),
        token: client.config.google_token
    }

    var manager = new GameManager(options);

    await manager.init();
}

class GameManager {
    constructor(options = {}) {
        this.voiceChannel = options.voiceChannel;
        this.textChannel = options.textChannel;
        this.searchApi = new youtubeSearchApi(options.token);
        this.scores = {};
        this.rounds = [];
        this.connection = undefined;
        this.animeList = options.list

        this.tvSizePlaytime = 90;
        this.roundLength = options.roundLength || 20;
        this.roundsMax = options.roundsMax || 5;
        this.currentRound = 0;
    }

    async init() {
        this.connection = await this.voiceChannel.join();
        this.rounds[this.currentRound] = await this.getRandomAnime();
        await this.start();
    } 

    async start() {
        this.currentRound++;
        console.log(`::start() -> Started round ${this.currentRound}`);

        if (this.currentRound <= this.roundsMax)
            this.rounds[this.currentRound + 1] = await this.getRandomAnime();
        
        var round = this.rounds[this.currentRound];
        var answers = this.getPossibleAnswers(round.anime);
        var answerers = [];

        const filter = msg => answers.includes(msg.content.trim().toLowerCase());
        const collector = this.textChannel.createMessageCollector(filter, { time: (this.roundLength + 5) * 1000 });
        collector.on('collect', msg => {
            var author = msg.author.id;

            if (answerers.includes(author))
                return;

            if (!this.scores[author])
                this.scores[author] = 1;
            else
                this.scores[author] += 1;

            answerers.push(author);
        });
        collector.on('end', async() => {
            const embed = {
                "author": {
                    "name": round.anime.title,
                    "url": round.anime.url
                },
                "color": 5624201,
                "footer": {
                    "text": round.anime.premiered
                },
                "image": {
                    "url": round.anime.image_url
                }
            };

            await this.textChannel.send("And the answer is...", { embed });
            await this.textChannel.send(`${(answerers.length > 0) ? answerers.map(id => `<@${id}>`).join(', ') : "Nobody"} got the correct answer!`);
            await Promise.delay(1000);
            await this.textChannel.send(`__Round #${this.currentRound} Leaders:__\n${this.formatLeaderboard(5).join('\n')}`);
            await Promise.delay(6000);

            if (this.currentRound < this.roundsMax)
                return await this.start();
            else
                return await this.finish();
        });

        this.textChannel.send(`**Round #${this.currentRound}!**`);
        await this.playTrackPreview(round.track);
    }

    async finish() {
        console.log(`::finish() -> Game ended.`);

        await this.textChannel.send("__Post-Game Results!__");
        await this.textChannel.send(`${this.formatLeaderboard().join('\n')}`);
        await this.textChannel.send(`Congratulations <@${sortProperties(this.scores)[0][0]}>, you won!`);
        this.voiceChannel.leave();
    }

    async getRandomAnime() {
        var anime = this.animeList[getRandomInt(0, this.animeList.length - 1)];
        var data = await Mal.anime(anime.mal_id);

        //var query = await this.searchApi.searchVideos(this.getSearchQuery(data), 1);
        var query = [
            {
                shortURL: "https://www.youtube.com/watch?v=pLQGfSQUuCM"
            }
        ];

        if (query.length < 1)
            return await this.getRandomAnime();

        var track = await youtubeDownload(query[0].shortURL);

        console.log(`::getRandomAnime() -> ${anime.title}`);

        return { 
            anime: data,
            query: query,
            track: track 
        };
    }

    async playTrackPreview(track) {
        var options = {
            seek: getRandomInt(0, this.tvSizePlaytime - this.roundLength),
            bitrate: 'auto'
        }
    
        var dispatcher = await this.voiceChannel.connection.playOpusStream(track, options);
        dispatcher.on('start', async () => {
            await Promise.delay(this.roundLength * 1000);
            dispatcher.end();
        });
    }

    getPossibleAnswers(anime) {
        var answers = [];
        [
            "title",
            "title_english",
            "title_japanese"
        ].forEach(prop => {
            if (typeof anime[prop] == 'string')
                answers.push(anime[prop]);
        });

        return answers.concat(anime.title_synonyms).map((a) => a.toLowerCase());
    }

    getSearchQuery(anime) {
        const types = [ "opening_themes", "ending_themes" ];
        const themes = anime[types[getRandomInt(0, 1)]];
    
        return themes[getRandomInt(0, themes.length - 1)];
    }

    formatLeaderboard(length) {
        var sorted = sortProperties(this.scores);

        if (length)
            sorted = sorted.slice(0, length - 1);
        
        return sorted.map(this.formatLeaderboardEntry)
    }

    formatLeaderboardEntry(entry, index) {
        var member = this.textChannel.guild.members.get(entry[0]);
        var name = member.nickname || member.user.username;
        
        return `:black_small_square: ${(index == 0) ? "**" : ""}${name} (${entry[1]} points)${(index == 0) ? "**" : ""}`;
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min)) + min;
}

// Source: https://gist.github.com/umidjons/9614157
function sortProperties(obj) {
    var sortable = [];
    
	for (var key in obj)
		if(obj.hasOwnProperty(key))
            sortable.push([key, obj[key]]);
            
    sortable.sort(function(a, b) {
        return a[1] - b[1];
    });

	return sortable;
}