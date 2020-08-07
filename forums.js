var discord = require('discord.js');
var client = new discord.Client();
const cp = require('child_process');
const { JSDOM } = require('jsdom');

var getLinks = function (str) {
    str = str.split(/\s+/);
    var links = [];
    for (var x of str) {
	if (x.indexOf('http://') === 0 || x.indexOf('https://') === 0) {
	    links.push(x);
	}
    }
    return links;
}

client.on('message', function (message) {
    if (message.content.indexOf('hsquizbowl.org/forums') !== -1) {
	var links = getLinks(message.content);
	var posts = [];
	for (var x of links) {
	    if (x.indexOf('hsquizbowl.org/forums') !== -1) {
		posts.push(x);
	    }
	}
	for (var post of posts) {
	    cp.exec('curl "' + post + '"', function (error, stdout, stderr) {
		try {
		    var dom = new JSDOM(stdout);
		    var window = dom.window;
		    var document = dom.window.document;
		    var url = new URL(post);
		    var postID = url.searchParams.get('p');
		    if (postID) {
			var postHTML = document.getElementById('post_content' + postID);
		    } else {
			var postHTML = document.getElementsByClassName('post').item('0');
		    }
		    var title = postHTML.getElementsByTagName('H3').item(0).getElementsByTagName('A').item(0).innerHTML;
		    var body = postHTML.getElementsByClassName('content').item(0).innerHTML.replace(/<[^<>]+>/g, '');
		    
		    if (body.length > 512) {
			body = body.substring(0, 509);
			body += '...';
		    }
		    if (postID) {
			try {
			    var signature = document.getElementById('sig' + postID).innerHTML;
			    if (signature.length > 512) {
                                signature = signature.substring(0, 509);
                                signature += '...';
                            }
			} catch (e) { var signature = ''; }
		    } else {
			try {
			    var signature = document.getElementsByClassName('signature').item(0).innerHTML;
			    if (signature.length > 512) {
				signature = signature.substring(0, 509);
				signature += '...';
			    }
			} catch (e) { var signature = ''; }
		    }
		    var author = '??';
		    try {
			author = postHTML.getElementsByClassName('username').item(0).innerHTML;
		    } catch (e) {
			author = postHTML.getElementsByClassName('username-coloured').item(0).innerHTML;
		    }
		    var embed = new discord.MessageEmbed();
		    embed.setColor('#7099be');
		    embed.setTitle(title);
		    embed.setAuthor(author);
		    embed.setDescription(body.replace(/\<br\>/g, ''));
		    embed.setFooter(signature.replace(/\<br\>/g, ''));
		    message.channel.send(embed);
		} catch (e) {
		    console.error(e);
		    message.channel.send('Could not preview post; it may be in a locked subforum.');
		}
	    });
	}
    }
});

client.on('ready', function () {
    console.log('logged in as ' + client.user.tag);
});

client.login(String(require('fs').readFileSync(__dirname + '/token.txt')));
