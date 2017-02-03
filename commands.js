exports.commands = [
	"ping",
	"idle",
	"online",
	"say",
	"announce",
	"msg",
	"eval",
	"setUsername",
	"log",
	"uptime"
]

var startTime = Date.now();

exports.ping = {
	description: "responds pong, useful for checking if bot is alive",
	process: function(bot, msg, suffix) {
		msg.channel.sendMessage(msg.author+" pong!");
		if(suffix){
			msg.channel.sendMessage( "note that !ping takes no arguments!");
		}
	}
}

exports.idle = {
	usage: "[status]",
	description: "sets bot status to idle",
	process: function(bot,msg,suffix){
		bot.user.setStatus("idle");
		bot.user.setGame(suffix);
	}
}

exports.online = {
	usage: "[status]",
	description: "sets bot status to online",
	process: function(bot,msg,suffix){
		bot.user.setStatus("online");
		bot.user.setGame(suffix);
	}
}

exports.say = {
	usage: "<message>",
	description: "bot says message",
	process: function(bot,msg,suffix){ msg.channel.sendMessage(suffix);}
}

exports.announce = {
	usage: "<message>",
	description: "bot says message with text to speech",
	process: function(bot,msg,suffix){ msg.channel.sendMessage(suffix,{tts:true});}
}

exports.msg = {
	usage: "<user> <message to leave user>",
	description: "leaves a message for a user the next time they come online",
	process: function(bot,msg,suffix) {
		var args = suffix.split(' ');
		var user = args.shift();
		var message = args.join(' ');
		if(user.startsWith('<@')){
			user = user.substr(2,user.length-3);
		}
		var target = msg.channel.guild.members.find("id",user);
		if(!target){
			target = msg.channel.guild.members.find("username",user);
		}
		messagebox[target.id] = {
			channel: msg.channel.id,
			content: target + ", " + msg.author + " said: " + message
		};
		updateMessagebox();
		msg.channel.sendMessage("message saved.");
	}
}

exports.eval = {
	usage: "<command>",
	description: 'Executes arbitrary javascript in the bot process. User must have "eval" permission',
	process: function(bot,msg,suffix) {
		if(Permissions.checkPermission(msg.author,"eval")){
			msg.channel.sendMessage( eval(suffix,bot));
		} else {
			msg.channel.sendMessage( msg.author + " doesn't have permission to execute eval!");
		}
	}
}

exports.setUsername = {
	description: "sets the username of the bot. Note this can only be done twice an hour!",
	process: function(bot,msg,suffix) {
		bot.user.setUsername(suffix);
	}
}

exports.log = {
	usage: "<log message>",
	description: "logs message to bot console",
	process: function(bot,msg,suffix){console.log(msg.content);}
}

exports.uptime = {
	//usage: "",
	description: "returns the amount of time since the bot started",
	process: function(bot,msg,suffix){
		var now = Date.now();
		var msec = now - startTime;
		console.log("Uptime is " + msec + " milliseconds");
		var days = Math.floor(msec / 1000 / 60 / 60 / 24);
		msec -= days * 1000 * 60 * 60 * 24;
		var hours = Math.floor(msec / 1000 / 60 / 60);
		msec -= hours * 1000 * 60 * 60;
		var mins = Math.floor(msec / 1000 / 60);
		msec -= mins * 1000 * 60;
		var secs = Math.floor(msec / 1000);
		var timestr = "";
		if(days > 0) {
			timestr += days + " days ";
		}
		if(hours > 0) {
			timestr += hours + " hours ";
		}
		if(mins > 0) {
			timestr += mins + " minutes ";
		}
		if(secs > 0) {
			timestr += secs + " seconds ";
		}
		msg.channel.sendMessage("**Uptime**: " + timestr);
	}
}
