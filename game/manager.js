const { Mal } = require('node-myanimelist');
const Promise = require('bluebird');
const youtubeDownload = require('ytdl-core-discord');
const youtubeSearchApi = require('simple-youtube-api');
const similarity = require('string-similarity');

class GameManager {
    constructor(options = {}) {
        this.voiceChannel = options.voiceChannel;
        this.textChannel = options.textChannel;
        this.searchApi = new youtubeSearchApi(options.token || "");
        this.scores = {};
        this.rounds = [];
        this.played = [];
        this.connection = undefined;
        this.animeList = undefined;
        this.collector = undefined;

        this.tvSizePlaytime = 90;
        this.animeYear = options.animeYear || "";
        this.animeSeason = options.animeSeason || "";
        this.roundLength = options.roundLength || 20;
        this.roundsMax = options.roundsMax || 5;
        this.allowDupes = options.allowDupes || false;
        this.currentRound = 0;

        this.client = undefined || options.client;
        this.message = undefined || options.message;
        this.debug = options.debug || false;
    }

    async init(startGame = true) {
        var season = (!this.debug) ? await Mal.season(this.animeYear, this.animeSeason) :
            require('../test/season.json');
        this.animeList = season.anime.filter(show => show.type == "TV" && show.kids == false && show.members > 900);
        
        if (!startGame)
            return;

        this.client.setting.set(this.message.guild.id, true, "_quizIsActive");
        this.connection = await this.voiceChannel.join();
        this.rounds[1] = await this.getRandomAnime();
        await this.start();
    } 

    async start() {
        this.currentRound++;
        console.log(`::start() -> Started round ${this.currentRound}`);

        if (this.currentRound < this.roundsMax)
            this.rounds[this.currentRound + 1] = await this.getRandomAnime();
        
        var round = this.rounds[this.currentRound];
        var answers = this.getPossibleAnswers(round.anime);
        var answerers = [];

        const filter = msg => this.processAnswer(answers, msg);
        this.collector = this.textChannel.createMessageCollector(filter, { time: (this.roundLength + 5) * 1000 });
        this.collector.on('collect', msg => {
            var author = msg.author.id;

            if (answerers.includes(author))
                return;

            if (!this.scores[author])
                this.scores[author] = 1;
            else
                this.scores[author] += 1;

            answerers.push(author);
        });
        this.collector.on('end', async(_, reason) => {
            if (reason == "force")
                return;

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
            await this.playTrack(round.track, 6);
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
        if (Object.keys(this.scores).length > 0) {
            await this.textChannel.send(`${this.formatLeaderboard().join('\n')}`);
            await this.textChannel.send(`Congratulations <@${sortProperties(this.scores)[0][0]}>, you won!`);
        }
        else
            await this.textChannel.send("Nobody won. Better luck next time!");
        
        this.cleanup();
    }

    async end() {
        console.log(`::end() -> Game forcibly ended.`);

        this.collector.stop('force');
        await this.textChannel.send("The game has been aborted.");

        this.cleanup();
    }

    async getRandomAnime() {
        var anime = this.animeList[getRandomInt(0, this.animeList.length - 1)];

        if (this.played.includes(anime.title))
            return await this.getRandomAnime();

        this.played.push(anime.title);

        var data = await Mal.anime(anime.mal_id);

        var query = (!this.debug) ? await this.searchApi.searchVideos(this.getSearchQuery(data), 1) :
            [{ shortURL: "https://www.youtube.com/watch?v=pLQGfSQUuCM" }];

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

    async playTrack(track, length) {
        var options = {
            seek: this.tvSizePlaytime - 30,
            bitrate: 'auto'
        }
    
        var dispatcher = await this.voiceChannel.connection.playOpusStream(track, options);
        dispatcher.on('start', async () => {
            await Promise.delay(length * 1000);
            dispatcher.end();
        });
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

    cleanup() {
        this.client.setting.set(this.message.guild.id, false, "_quizIsActive");
        delete this.client.activeGames[this.message.guild.id];
        this.voiceChannel.leave();
    }

    processAnswer(ans, msg) {
        var score = 0;

        msg = msg.content.trim().replace(/[^\w\s]/gi, '').toLowerCase();
        ans.forEach(answer => {
            var similarityScore = similarity.compareTwoStrings(answer, msg);

            score = (similarityScore > score) ? similarityScore : score;
        });

        return score > 0.45;
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

        return answers.concat(anime.title_synonyms).map((a) => a.replace(/[^\w\s]/gi, '').toLowerCase());
    }

    getSearchQuery(anime) {
        const type = [ "op", "ed" ];
        return anime.title + " " + type[getRandomInt(0, 1)];
    }

    formatLeaderboard(length) {
        var sorted = sortProperties(this.scores);

        if (length)
            sorted = sorted.slice(0, length - 1);
        
        return sorted.map((entry, index) => this.formatLeaderboardEntry(entry, index));
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

module.exports = GameManager;