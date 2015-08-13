#Bemused  <img src="https://raw.githubusercontent.com/pfarrell/bemused/master/coverage/coverage-badge.png" align="right" height="25" >

A simple sinatra based media library

search bar is a command bar

|path|description|
|---|---|
|/active, /a|playlist of tracks with plays in past 2 weeks|
|/albums/recent|Recently uploaded albums|
|/logs, /l|Log entries of plays|
|/newborns /n|Recently added tracks|
|/playlists, /p|User created playlists|
|/upload, /u|Upload file(s)|                                             h
|/radio|Unending random playlist|
|/rand, /r|Load a random album|
|/top|Playlist of most played tunes|
|/track\_paths|Search of file metadata, returns JSON|
|/tracks, /t|Changes search to be for track names, not album/artist names|



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
