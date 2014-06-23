#! /usr/bin/env ruby

require 'id3tag'
require 'redis'
require '../app'
require 'byebug'





mp3 = Mp3.new(ARGV[0])


#Read tags
tags = mp3.tags

# mv to error dir if no tags, add to error queue


# mv to nas if tagged
nas_location = "#{ENV["BEMUSED_UPLOAD_BASE"]}/#{tags.artist}/#{tags.album}/#{File.basename(mp3.tags.source)}"

FileUtils.mkdir_p(File.dirname(nas_location))
#FileUtils.mkdir_p(File.path(mp3.source)
FileUtils.mv(ARGV[0], nas_location)

artist = Artist.find_or_create(name: tags.artist)
album = Album.find_or_create(artist: artist, title: tags.album)
track = Track.find_or_create(artist: artist, album: album, title: tags.title)
byebug
file = MediaFile.find_or_create(absolute_path: nas_location)
file.track = track;
file.save
track.media_file = file
track.save


# create track
  # create/retrieve artist
  # create/retrieve album
  # create media_file
  # create track

