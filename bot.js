const Discord = require("discord.js");
const fs = require("fs")
const bot = new Discord.Client();

try {
  var Auth = require("./auth.json");
} catch (e) {
  console.log("'auth.json' is missing.\n"+e.stack);
  process.exit();
}

try {
  var config = require("./config.json");
} catch (e) {
  console.log("'config.json' is missing.\n"+e.stack);
  process.exit();
}

bot.on('ready', () => {
  console.log(bot.user.username+" is ready!");
  load_plugins();
  if(config.guildid){
    bot.guilds.get(config.guildid).defaultChannel.sendMessage("*Hello everyone! "+bot.user.username+" is now online!*")
    .then((message => message.delete(5000)));
  };
});

var messagebox;
try{
	messagebox = require("./messagebox.json");
} catch(e) {
	//no stored messages
	messagebox = {};
}
function updateMessagebox(){
	writeFile("./messagebox.json",JSON.stringify(messagebox,null,2), null);
}

var aliases;
try{
	aliases = require("./alias.json");
} catch(e) {
	//No aliases defined
	aliases = {};
}

var commands = {
	"alias": {
		usage: "<name> <actual command>",
		description: "Creates command aliases. Useful for making simple commands on the fly",
		process: function(bot,msg,suffix) {
			var args = suffix.split(" ");
			var name = args.shift();
			if(!name){
				msg.channel.sendMessage(config.commandPrefix + "alias " + this.usage + "\n" + this.description);
			} else if(commands[name] || name === "help"){
				msg.channel.sendMessage("overwriting commands with aliases is not allowed!");
			} else {
				var command = args.shift();
				aliases[name] = [command, args.join(" ")];
				//now save the new alias
				require("fs").writeFile("./alias.json",JSON.stringify(aliases,null,2), null);
				msg.channel.sendMessage("created alias " + name);
			}
		}
	},
	"aliases": {
		description: "lists all recorded aliases",
		process: function(bot, msg, suffix) {
			var text = "current aliases:\n";
			for(var a in aliases){
				if(typeof a === 'string')
					text += a + " ";
			}
			msg.channel.sendMessage(text);
		}
	}
};

function checkMessage(msg, isEdit) {
	//check if message is a command
  if(config.botMentionCommand){
    var commandPrefix = "@"+bot.user.username+"#"+bot.user.discreaminator;
  } else {
    var commandPrefix = config.commandPrefix;
  }
	if(msg.author.id != bot.user.id && (msg.content.startsWith(commandPrefix))){
    console.log("treating " + msg.content + " from " + msg.author + " as command");
		var cmdTxt = msg.content.split(" ")[0].substring(commandPrefix.length);
    var suffix = msg.content.substring(cmdTxt.length+commandPrefix.length+1);//add one for the ! and one for the space
    if(msg.isMentioned(bot.user)){
			try {
				cmdTxt = msg.content.split(" ")[1];
				suffix = msg.content.substring(bot.user.mention().length+cmdTxt.length+commandPrefix.length+1);
			} catch(e){ //no command
				msg.channel.sendMessage("(◕‸◕)?");
				return;
			}
    }
		alias = aliases[cmdTxt];
		if(alias){
			console.log(cmdTxt + " is an alias, constructed command is " + alias.join(" ") + " " + suffix);
			cmdTxt = alias[0];
			suffix = alias[1] + " " + suffix;
		}
		var cmd = commands[cmdTxt];
    if(cmdTxt === "help"){
      //help is special since it iterates over the other commands
			if(suffix){
				var cmds = suffix.split(" ").filter(function(cmd){return commands[cmd]});
				var info = "";
				for(var i=0;i<cmds.length;i++) {
					var cmd = cmds[i];
					info += "**"+commandPrefix + cmd+"**";
					var usage = commands[cmd].usage;
					if(usage){
						info += " " + usage;
					}
					var description = commands[cmd].description;
					if(description instanceof Function){
						description = description();
    			}
				  if(description){
						info += "\n\t" + description;
					}
				  info += "\n"
				}
				msg.channel.sendMessage(info);
			} else {
				msg.author.sendMessage("**Available Commands:**").then(function(){
				  var batch = "";
				  var sortedCommands = Object.keys(commands).sort();
					for(var i in sortedCommands) {
						var cmd = sortedCommands[i];
						var info = "**"+commandPrefix + cmd+"**";
						var usage = commands[cmd].usage;
						if(usage){
							info += " " + usage;
						}
						var description = commands[cmd].description;
						if(description instanceof Function){
							description = description();
						}
						if(description){
							info += "\n\t" + description;
						}
						var newBatch = batch + "\n" + info;
						if(newBatch.length > (1024 - 8)){ //limit message length
							msg.author.sendMessage(batch);
							batch = info;
						} else {
							batch = newBatch
						}
					}
					if(batch.length > 0){
						msg.author.sendMessage(batch);
					}
				});
			}
    }
		else if(cmd) {
			if(Permissions.checkPermission(msg.author,cmdTxt)){
				try{
					cmd.process(bot,msg,suffix,isEdit);
				} catch(e){
					var msgTxt = "command " + cmdTxt + " failed :(";
					if(config.debug){
					  msgTxt += "\n" + e.stack;
					}
					msg.channel.sendMessage(msgTxt);
				}
			} else {
				msg.channel.sendMessage("You are not allowed to run " + cmdTxt + "!");
			}
		} else {
			msg.channel.sendMessage(cmdTxt + " not recognized as a command!").then((message => message.delete(5000)))
		}
	} else {
		//message isn't a command or is from us
    //drop our own messages to prevent feedback loops
    if(msg.author == bot.user){
      return;
    }
    if (msg.author != bot.user && msg.isMentioned(bot.user)) {
			if (msg.channel.guild.members.get(msg.author.id).highestRole.name === "leader") {
				msg.channel.sendMessage("Master " + msg.author + ", you called?");
			} else if (msg.channel.guild.members.get(msg.author.id).highestRole.name === "noble") {
				msg.channel.sendMessage("Lord " + msg.author + ", you called?")
			} else {
				msg.channel.sendMessage(msg.author + ", you called?")
			}
        } else {

				}
    }
}

bot.on("message", (msg) => checkMessage(msg, false));
bot.on("messageUpdate", (oldMessage, newMessage) => {
	checkMessage(newMessage,true);
});

bot.on("presence", function(user,status,gameId) {
	//if(status === "online"){
	//console.log("presence update");
	console.log(user+" went "+status);
	//}
	try{
	if(status != 'offline'){
		if(messagebox.hasOwnProperty(user.id)){
			console.log("found message for " + user.id);
			var message = messagebox[user.id];
			var channel = bot.channels.get("id",message.channel);
			delete messagebox[user.id];
			updateMessagebox();
			bot.sendMessage(channel,message.content);
		}
	 }
	}catch(e){}
});

function addCommand(commandName, commandObject){
  try {
    commands[commandName] = commandObject;
  } catch(err){
    console.log(err);
  }
}
function commandCount(){
  return Object.keys(commands).length;
}

function load_plugins(){
  var commandCnt = 0;
  var plugin;
  try{
    plugin = require("./commands.js");
  } catch (err){
  console.log("Improper setup of commands.js : " + err);
  }
  if (plugin){
    if("commands" in plugin){
      for (var j = 0; j < plugin.commands.length; j++) {
        if (plugin.commands[j] in plugin){
          addCommand(plugin.commands[j], plugin[plugin.commands[j]]);
          commandCnt++;
        }
      }
    }
  }
  console.log("Loaded "+commandCount()+" chat commands");
}

if(Auth.bot_token){
	console.log("logging in with token");
	bot.login(Auth.bot_token);
} else {
  console.log("'bot_token' in 'auth.json' is missing.");
}