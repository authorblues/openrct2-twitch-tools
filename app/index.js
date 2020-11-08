const {app, BrowserWindow} = require('electron');
let windows = new Map();

function createWindow(name, page, options)
{
	let _options = options || {width: 400, height: 500, webPreferences: {nodeIntegration: true}};
	_options.show = false;

	let window = new BrowserWindow(_options);
	window.once('ready-to-show', () => {
		window.show();
	});

	window.loadFile(page);

	windows.set(name, window);
	window.on('closed', () => {
		windows.delete(name);
	});

	return window;
}

app.on('ready', () => {
	let main = createWindow('main', 'src/index.html');
	main.setMenu(null);
//	main.openDevTools('undocked');
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
