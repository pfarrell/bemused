#! /usr/bin/env ruby

require 'id3tag'
require '../app'

mp3 = Mp3.new(ARGV[0])

#Read tags
tags = mp3.tags

# mv to error dir if no tags, add to error queue


# mv to nas if tagged
#nas_location = "#{ENV["BEMUSED_UPLOAD_BASE"]}/#{tags.artist}/#{tags.album}/#{File.basename(mp3.tags.source)}"

artist = Artist.find_or_create(name: tags.artist)
album = Album.find_or_create(artist: artist, title: tags.album)
track = Track.find_or_create(artist: artist, album: album, title: tags.title)
track.track_number = tags.track_nr
track.save
file = MediaFile.find_or_create(absolute_path: ARGV[0])
file.track = track;
file.save
track.media_file = file
begin
  track.save
rescue 
end

puts "processed: #{File.basename(mp3.tags.source)}"
