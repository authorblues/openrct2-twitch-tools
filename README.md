# OpenRCT2 Twitch Tools
Includes a number of features for Twitch streamers to allow viewers to interact with the game (most features can be disabled):

- Unnamed guests will be renamed after people who talk in your stream chat
- Cheering bits in chat will give money to that user's guest (at a rate of 1 bit = $1 in-game)
- Cheering more than 100 bits in one message will reset the guest's stats to encourage them to stay in the park
- Unnamed staff members will be renamed after people who subscribe or resub during the stream
- Hosts, raids, and gift subs will be shown as a park alert in-game
- Banned chatters will have their name removed from the game, and the associated guest will explode (optionally)

Built using [Oli414's graciously shared boilerplate project](https://github.com/oli414/openrct2-plugin-boilerplate).

## How to Setup the Plugin
1. Find [the most recent release](https://github.com/authorblues/openrct2-twitch-tools/releases).
2. Download the plugin (`TwitchTools.js`) and install in your /OpenRCT2/plugins folder (this folder can most likely be found in your Documents folder on Windows)
3. Download the relay app (`TwitchToolsApp*.exe`). We cannot connect to Twitch chat servers directly from the plugin, so this tool connects to Twitch chat and sends information to the plugin.
4. Open the relay app, type your Twitch username (just your name, not the full URL) in the top textbox. Press enter, or click the "Start" button.
5. Change any of the settings you would like to change in the relay app.
6. Open OpenRCT2. The plugin will connect to the relay app and you should be ready to go.

## How to Setup OpenRCT2
- [Quickstart Guide for OpenRCT2 on Windows](https://openrct2.org/quickstart/install/windows)
- Note: You can add RCT1 scenarios in game through the options menu.
