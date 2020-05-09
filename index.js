const Discord = require('discord.js');
const { prefix, token } = require('./config.json');

const client = new Discord.Client();
const ytdl = require("ytdl-core");

const queue = new Map();

client.once('ready', () => {
	console.log('Ready!');
});

client.on("message", message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
  
    const serverQueue = queue.get(message.guild.id);

    if (message.content.startsWith(`${prefix}queue`)) {
        execute(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}play`)) {
        execute(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}skip`)) {
        skip(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}disconnect`)) {
        disconnect(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}clear`)) {
        clear(message);
        return;
    }
  });
  
  async function execute(message, serverQueue) {
    const args = message.content.split(" ");
  
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send(
        "You need to be in a voice channel to play music!"
      );
  
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
      title: songInfo.title,
      url: songInfo.video_url
    };
  
    if (!serverQueue) {
      const queueContruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true
      };
  
      queue.set(message.guild.id, queueContruct);
  
      queueContruct.songs.push(song);
  
      try {
        var connection = await voiceChannel.join();
        queueContruct.connection = connection;
        play(message.guild, queueContruct.songs[0]);
      } catch (error) {
        console.log(error);
        queue.delete(message.guild.id);
        return;
      }
    } else {
      serverQueue.songs.push(song);
      return message.channel.send(`**${song.title}** has been added to the queue!`);
    }
  }
  
  function skip(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "You have to be in a voice channel to stop the music!"
      );
    if (!serverQueue)
      return message.channel.send("There is no song that I could skip!");
    serverQueue.connection.dispatcher.end();
  }
  
  function disconnect(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "You have to be in a voice channel to stop the music!"
      );
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
  }
  
  function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }
  
    const dispatcher = serverQueue.connection
      .play(ytdl(song.url))
      .on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
      })
      .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
  }
  
  function clear(message) {
      const args = message.content.split(" ");
      if (!args[1]) return message.channel.send("Please specify the number of lines to clear!");
      if (args[1] > 100 || args[1] < 1) return message.channel.send("Needs to be from 1 to 100, please try again!");
      if (isNaN(Number(args[1]))) return message.channel.send("Not a number, please try again!");
      message.channel.bulkDelete(args[1]);
  }


client.login(token);
