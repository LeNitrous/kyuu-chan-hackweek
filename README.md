# Kyuu-chan
The Discord bot that replicates the [Anime Music Quiz](https://animemusicquiz.com) experience! The trivia game of guessing what anime the song originates from.

Made for the 1st Annual Discord Hackweek.

## Prerequisites
- NodeJS 8 or later

## Libraries Used
- DiscordJS
- Node Web Audio API
- Node MyAnimeList
- Soundcloud API Client
- FFMpeg

## Guide
- [Setting Up](Setting_Up)
    - Bot Installation
    - Guild Setup
- [Gameplay](Gameplay)
- [FAQ](FAQ)

### Setting Up
#### Bot Installation
1. Install NodeJS and download this repository.
2. Create a `config.json` in the root directory containing:
    ```json
    {
        "bot_prefix": "?",
        "bot_token": "",
        "soundcloud_token": ""
    }
    ```
3. Get your bot token in Discord's Developer Portal.
4. Get your app token in Soundcloud.
5. Configure your bot.
    - `bot_prefix` defines the symbol for commands. Must not be empty.
    - `bot_token` is provided by your app
    - `soundcloud_token` is provided by soundcloud api..
6. Launch the bot using `npm run start`

#### Guild Setup
1. Invite the bot to your server. Anyone with the `Kyuu-chan` role will have access to the bot's administrator commands.
2. Create a text and voice channel named `#anime-music-quiz`. This is where the game will take place.
3. Join a voice channel and run `?start` to begin a game.

### Gameplay
1. Each round has 30 seconds. This is when the bot plays a random song at a random part of it. You must guess the anime's name. You must be in the `#anime-music-quiz` voice channel to make your guesses valid.
    - It can be in Japanese, English, Romanized Japanese.
    - Capitalization does not matter though be wary of typos.
    - You have an unlimited number of guesses. The most recent sent message is your current guess.
2. The faster you guess right the higher the score you get.
3. After a number of rounds, the player who has the most number of points wins the game.

### FAQ
- **Can players join mid-games?**
    - Yes, they only must be in the voice channel at the same time send their answers in the text channel to make their guesses valid.
- **How can I set custom text and voice channels for the quizzes?**
    - Unfortunately you can't for now.
- **Can I run more than one game at a time?**
    - Only 1 game per guild.
- **Can I play alone?**
    - Sounds kinda sad but yes, yes you can.
- **Why won't \<anime> show up?**
    - Likely because we can't find a music track for it.
