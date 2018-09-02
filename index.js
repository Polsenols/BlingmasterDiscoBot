var Discord = require('discord.js');
const readline = require('readline');
var audioconcat = require('audioconcat');
var bot = new Discord.Client();
var isReady = true;
var fs = require('fs');
var youtubedl = require('ytdl-core');
var txtmp3 = require("text-to-mp3");
var musicFiles = initMusicFiles();
var streamy = fs.createWriteStream("./AudioFiles/Test.mp3");
var TTSactivated = false;
var adminID = '276133471041224716';

var prefix = '%';
//Music bot
var streamOptions = {
  seek: 0,
  volume: 0.5
};

var ytsearch = require('youtube-search');
var opts = {
  maxResults: 3,
  key: 'AIzaSyC9n7T1s22Ywx7liVumLTxVs4z6apiV5rc',
  type: 'video'
};
var servers = {};
//




bot.on('message', message => {


  if (message.content.startsWith("%tts")) {
    var ttsmsg = message.content.split(' ');
    ttsmsg.shift();
    ttsmsg.join();
    PlayTTSMsg(ttsmsg, message);
  }


  //Leaving channel
  if (message.content === '%leave') {
    message.member.voiceChannel.leave();
  }

  //Joining channel
  if (message.content === '%join') {
    JoinChannel(message);
  }

  if (message.content.startsWith("%tts") && TTSactivated === true) {
    streamy = fs.createWriteStream("./AudioFiles/Test.mp3");
    var ttsmsg = message.content.split(' ');
    ttsmsg.shift();
    ttsmsg.join();
    txtmp3.getMp3(ttsmsg, function (err, binaryStream) {
      if (err) {
        console.log(err);
        return;
      }
      streamy.write(binaryStream, function (err) { streamy.end() });
      isReady = false;

      streamy.on('close', function () {

        var concatSamples = [
          './AudioFiles/Test.mp3',
          './AudioFiles/silence.mp3'
        ]

        audioconcat(concatSamples)
          .concat('./AudioFiles/all.mp3')
          .on('start', function (command) {
            console.log('ffmpeg process started:', command)
          })
          .on('error', function (err, stdout, stderr) {
            console.error('Error:', err)
            console.error('ffmpeg stderr:', stderr)
          })
          .on('end', function (output) {
            var VC = message.member.voiceChannel;
            VC.join().then(connection => {
              //Play the audio file in the dispatcher, which will set the bot to ready when it is done playing
              const dispatcher = connection.playFile('./AudioFiles/all.mp3');
              dispatcher.on("end", end => {
                isReady = true;
              })
            })
            console.error('Audio created in:', output)
          })

      });

    })
  }

  var args = message.content.substring(prefix.length).split(" ");

  switch (args[0].toLowerCase()) {

    case "play":
      if (!args[1] || !message.member.voiceChannel) {
        message.channel.send("Retard. " + GetRandomError());
        return;
      }

      if (!servers[message.guild.id]) servers[message.guild.id] = {
        queue: []
      };

      var server = servers[message.guild.id];

      SearchYoutubeLink(args, server, message);

      if (!message.guild.voiceConnection) message.member.voiceChannel.join().then(function (connection) {
        StreamMusic(connection, message);
      });
      break;

    //Skips the currently playing song, which will call the dispatchers "end" function.
    case "skip":
      var server = servers[message.guild.id];

      if (server.dispatcher) server.dispatcher.end();
      break;

    case "stop":
      var server = servers[message.guild.id];
      if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();
      break;
  }

  //Play sounds
  PlaySound(message);

});

bot.login('NDgzMjU5NjkxNDU2MTM1MTkw.DmRHzw.oyV7CzU3Lmls3sHUagwMpFte4U8');

function PlaySound(msg) {
  //For each file in the audio file directory
  for (var musicFile in musicFiles) {
    //If the bot is not currently playing an audio file, and the msg content matches a file name
    if (isReady && msg.content === '%p ' + musicFiles[musicFile]) {
      var VC = msg.member.voiceChannel;
      VC.join().then(connection => {
        //Play the audio file in the dispatcher, which will set the bot to ready when it is done playing
        const dispatcher = connection.playFile('./AudioFiles/' + musicFiles[musicFile] + '.mp3');
        dispatcher.on("end", end => {
          isReady = true;
        })
      })
      break;
    }
  }
}

function SearchYoutubeLink(title, server, msg) {
  var searchtitle = title;
  searchtitle.shift();
  searchtitle.join();
  searchtitle = searchtitle.toString().replace(",", " ");;

  ytsearch(searchtitle, opts, function (err, results) {
    if (err) return msg.channel.send("Error.");
    server.queue.push(results[0].link);
    msg.channel.send("Added: | " + results[0].title + " | to the queue.");
  })
}

function StreamMusic(connection, message) {
  var server = servers[message.guild.id];
  server.dispatcher = connection.playStream(youtubedl(server.queue[0], { filter: "audioonly" }), streamOptions);
  server.queue.shift();

  console.log(server.queue);
  server.dispatcher.on("end", function () {
    if (server.queue[0]) StreamMusic(connection, message);
    //else connection.disconnect();
  });
}

function PlayTTSMsg(TTSmessage, voiceMsg) {
  txtmp3.getMp3(TTSmessage, function (err, binaryStream) {
    if (err) {
      console.log(err);
      return;
    }
    streamy.end();
    streamy = fs.createWriteStream("./AudioFiles/Test.mp3");
    streamy.write(binaryStream, function (err) { streamy.end() });
    isReady = false;

    streamy.on('close', function () {

      var concatSamples = [
        './AudioFiles/Test.mp3',
        './AudioFiles/silence.mp3'
      ]

      audioconcat(concatSamples)
        .concat('./AudioFiles/all.mp3')
        .on('start', function (command) {
          console.log('ffmpeg process started:', command)
        })
        .on('error', function (err, stdout, stderr) {
          console.error('Error:', err)
          console.error('ffmpeg stderr:', stderr)
        })
        .on('end', function (output) {
          var VC = voiceMsg.member.voiceChannel;
          VC.join().then(connection => {
            //Play the audio file in the dispatcher, which will set the bot to ready when it is done playing
            const dispatcher = connection.playFile('./AudioFiles/all.mp3');
            dispatcher.on("end", end => {
              isReady = true;
            })
          })

          console.error('Audio created in:', output)
        })

    });

  })
}

function GetRandomError() {
  var letters = "ABCDEFG";

  var errorLetter = letters.charAt(Math.floor(Math.random() * letters.length));
  return "I mean, *BZZRT* error " + Math.floor(1000 + (Math.random() * 9000)).toString() + "-" + errorLetter;
}

function JoinChannel(msg) {
  if (msg.member.voiceChannel) {
    msg.member.voiceChannel.join();
  }
}


function initMusicFiles() {
  var bfiles = [];
  const testFolder = './AudioFiles/';
  var files = fs.readdirSync(testFolder);
  for (var i in files) {
    bfiles.push(files[i].split('.')[0]);
  }
  return bfiles;
}