A simple sinatra based media library

search bar is a command bar

|path|description|
|---|---|
|/active, /a|playlist of tracks with plays in past 2 weeks|
|/albums/recent|Recently uploaded albums|
|/albums/words|Top words used in album names|
|/logs, /l|Log entries of plays|
|/newborns /n|Recently added tracks|
|/playlists, /p|User created playlists|
|/radio|Comin' up, a lifetime of commercial free|
|/random, /r|Load a random album|
|/stats | load site statistics|
|/top|Playlist of most played tunes|
|/tracks, /t|Changes search to be for track names, not album/artist names|
|/tracks/words|Top words used in track titles|
|/track\_paths/{search}|Top words used in track titles|
|/upload, /u|Upload file(s)|                                             h

works on mobile, built on bootstrap

Clicking on images takes you to admin pages

#KeyBindings
this project supports many keyboard shortcuts for controlling the app.

|key|meaning|
|---|---|
|b|scrub track backward|
|f|scrub track forward|
|p|show/hide the playlist|
|r|randomize the playlist|
|s|search (on mobile sized screen)|
|:space|play/pause|
|←|previous track|
|→|next track|

uses bootstrap and masonry but images need some work...
keybindings are causing some conflicts with form based pages...
for instance, space doesn't work...
