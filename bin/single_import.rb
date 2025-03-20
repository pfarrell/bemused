#! /usr/bin/env ruby

require 'id3tag'
require './app'
require 'mp3info'

if not ARGV[0] or ARGV[0].nil?  then
  $stderr.puts 'usage: ruby ./single_import.rb [path to mp3 file]'
  exit(21)
end

file_path = File.expand_path(ARGV[0])
mp3 = Mp3.new(file_path)

#Read tags
tags = mp3.tags

artist = Artist.find_or_create(name: tags.artist)
album = Album.find_or_create(artist: artist, title: tags.album)
track = Track.find_or_create(artist: artist, album: album, title: tags.title)
track.track_number = tags.track_nr
track.save
file = MediaFile.find_or_create(absolute_path: file_path)
file.track = track;
file.save
track.media_file = file
track.duration_sec = Mp3Info.new(file_path).length.to_i
begin
  track.save
rescue
end

puts "processed: #{File.basename(mp3.tags.source)}"
