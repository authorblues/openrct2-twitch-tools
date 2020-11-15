const tmi = require('tmi.js');
var client = null;
var clientconnecting = false;

const Net = require('net');
const port = 61111;

var server = new Net.Server();
var socket = null;

var configoptions = [
	{ id: 'announce-raid', desc: 'Announce Raids/Hosts In-Game' },
	{ id: 'announce-gift', desc: 'Announce Gift Subs In-Game' },
	{ id: 'sub-staff', desc: 'Automatically Name Staff After Subscribers' },
	{ id: 'sub-staff-gift', desc: 'Automatically Name Staff After Gift Sub Recipients' },
	{ id: 'cheer-for-cash', desc: 'Cheering Bits Gives Cash to Guests (1 bit = $1 in-game)' },
	{ id: 'ban-explode', desc: 'Banning Chatter Explodes Their Guest' },
];

for (let config of configoptions)
{
	let div = document.createElement('div');

	let input = document.createElement('input');
	input.setAttribute('type', 'checkbox');
	input.setAttribute('name', config.id);
	input.setAttribute('id', config.id);
	input.setAttribute('checked', 'checked');
	div.appendChild(input);

	let label = document.createElement('label');
	label.setAttribute('for', config.id);
	label.appendChild(document.createTextNode(config.desc));
	div.appendChild(label);

	document.querySelector('#options-container').appendChild(div);
}

function isset(id)
{
	return !!document.querySelector('#' + id).checked;
}

function log(msg)
{
	document.querySelector('#logging').innerHTML += msg + "\n";
}

server.on("connection", (x) => {
	log('connection established');
	socket = x;
	socket.setNoDelay(true);

	socket.on("end", () => {
		log("connection closed");
	});

	socket.on("error", (err) => {
		error("connection error" + err);
		console.error('connection error', err);
	});
});

server.on("error", (e) => {
	console.error('server error', e);
	if (e.code === 'EADDRINUSE')
	{
		log('ERROR: cannot connect to port ' + port);
		log('- is the relay app already open?')
	}
});

server.listen(port, () => {
	log('server running');
});

function sendData(data)
{
	if (!socket) return;
	socket.write(JSON.stringify(data) + "\n");
}

function connectToTwitch(names)
{
	if (client)
	{
		if (clientconnecting) return;
		else client.disconnect();
	}

	log('connecting to Twitch channel(s):\n> ' + names.split(','));

	client = new tmi.Client({
		connection: {
			secure: true,
			reconnect: true,
		},
		channels: names.split(',')
	});

	clientconnecting = true;
	client.connect().then((data) => {
		clientconnecting = false;
	});

	client.on('message', (channel, tags, message, self) => {
		let data =
		{
			type: 'nameguest',
			name: makeGuestName(tags['display-name'], tags['username']),
			userid: tags['user-id'],
			color: tags['color'],
			extra: null,
		};

		if (tags['badges'])
		{
			if (tags['badges']['broadcaster']) return;
			else if (tags['badges']['moderator']) data.extra = 'mod';
			else if (tags['badges']['subscriber']) data.extra = 'sub';
		}

		sendData(data);
	});

	client.on("cheer", (channel, tags, message) => {
		let data =
		{
			type: 'sendmoney',
			name: makeGuestName(tags['display-name'], tags['username']),
			userid: tags['user-id'],
			dollars: isset('cheer-for-cash') ? +tags['bits'] : 0,
		};

		sendData(data);
	});

	client.on("anongiftpaidupgrade", (channel, username, userstate) => {
		if (!isset('sub-staff')) return;
		let data =
		{
			type: 'namestaff',
			name: makeGuestName(userstate['display-name'], userstate['username']),
			userid: userstate['user-id'],
		};

		sendData(data);
	});

	client.on("giftpaidupgrade", (channel, username, sender, userstate) => {
		if (!isset('sub-staff')) return;
		let data =
		{
			type: 'namestaff',
			name: makeGuestName(userstate['display-name'], userstate['username']),
			userid: userstate['user-id'],
		};

		sendData(data);
	});

	client.on("resub", (channel, username, months, message, userstate, methods) => {
		if (!isset('sub-staff')) return;
		let data =
		{
			type: 'namestaff',
			name: makeGuestName(userstate['display-name'], userstate['username']),
			userid: userstate['user-id'],
		};

		sendData(data);
	});

	client.on("subgift", (channel, username, streaklen, recipient, methods, userstate) => {
		if (!isset('sub-staff') || !isset('sub-staff-gift')) return;
		let data =
		{
			type: 'namestaff',
			name: makeGuestName(userstate['msg-param-recipient-display-name'], userstate['msg-param-recipient-user-name']),
			userid: userstate['msg-param-recipient-id'],
		};

		sendData(data);
	});

	client.on("submysterygift", (channel, username, subcount, methods, userstate) => {
		if (!isset('announce-gift')) return;
		let data =
		{
			type: 'celebrate',
			message: username + " just hired " + subcount +
				"new staff member" + (subcount == 1 ? "" : "s") + "!",
		};

		sendData(data);
	});

	client.on("subscription", (channel, username, method, message, userstate) => {
		if (!isset('sub-staff')) return;
		let data =
		{
			type: 'namestaff',
			name: makeGuestName(userstate['display-name'], userstate['username']),
			userid: userstate['user-id'],
		};

		sendData(data);
	});

	function raid(username, viewers)
	{
		if (!isset('announce-raid')) return;

		let threshold = getHostThreshold();
		if (viewers < threshold) return;

		let data =
		{
			type: 'celebrate',
			message: username + " just brought " +
				viewers + " new guests to the park!",
		};

		sendData(data);
	}

	client.on("hosted", (channel, username, viewers, autohost) => {
		if (!autohost) raid(username, viewers);
	});

	client.on("raided", (channel, username, viewers) => {
		raid(username, viewers);
	});

	client.on("ban", (channel, username, reason, tags) => {
		let data =
		{
			type: 'remove',
			userid: tags['target-user-id'],
			explode: isset('ban-explode'),
		};

		sendData(data);
	});
}

// this method only exists because the plugin interface doesn't seem to expose
// any information about what language the UI is set to, so we default to using
// usernames if they seem to be more than just capitalization preferences
function makeGuestName(display, username)
{
	return display.toLowerCase() == username.toLowerCase() ? display : username;
}

function getHostThreshold()
{
	return +document.querySelector('#host-threshold').value || 0;
}

function doConnect()
{
	let username = document.querySelector('#twitchuser').value;
	connectToTwitch(username);
}

document.querySelector('#setusername').onclick = doConnect;
document.querySelector('#twitchuser').onkeypress = function(e)
{
	e = e || window.event;
    if (e.keyCode == 13) doConnect();
}
