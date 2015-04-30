#Bemused
A simple sinatra based media library

search bar is a command bar

|path|description|
|---|---|
|/active|playlist of tracks with plays in past 2 weeks|
|/albums/recent|Recently uploaded albums|
|/logs|Log entries of plays|
|/newborns|Recently added tracks|
|/playlists|User created playlists|
|/upload|Upload file(s)|                                             h
|/radio|Unending random playlist|
|/rand|Load a random album|
|/top|Playlist of most played tunes|
|/track\_paths|Search of file metadata, returns JSON|
|/tracks|Changes search to be for track names, not album/artist names|



works on mobule, built on bootstrap

#KeyBindings
this project supports many keyboard shortcuts for controlling the app.

|key|meaning|
|---|---|
|b|scrub track backward|
|f|scrub track forward|
|p|show/hide the playlist|
|r|randomize the playlist|
|s|search|
|:space|play/pause|
|←|previous track|
|→|next track|

uses bootstrap and masonry but images need some work...
keybindings are causing some conflicts with form based pages...
for instance, space doesn't work...

![coverage report](https://raw.githubusercontent.com/pfarrell/bemused/master/coverage/coverage-badge.png)
