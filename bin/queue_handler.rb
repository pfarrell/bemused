#! /usr/bin/env ruby

require 'id3tag'
require 'redis'
require '../app'

redis = Redis.new

#while(redis.llen('bemused:incoming') > 0)
while(true)
  list, file = redis.blpop('bemused:incoming')
  mp3 = Mp3.new(file)

  #Read tags
  tags = mp3.tags
  
  # mv to error dir if no tags, add to error queue

  # mv to nas if tagged
  nas_location = "#{ENV["BEMUSED_UPLOAD_BASE"]}/#{tags.artist}/#{tags.album}/#{File.basename(mp3.tags.source)}"

  FileUtils.mkdir_p(File.dirname(nas_location))
  begin
    FileUtils.mv(file, nas_location, verbose: true)
  rescue Exception
  end

  artist = Artist.find_or_create(name: tags.artist)
  album = Album.find_or_create(artist: artist, title: tags.album)
  track = Track.find_or_create(artist: artist, album: album, title: tags.title)
  track.track_number = tags.track_nr
  track.save
  file = MediaFile.find_or_create(absolute_path: nas_location)
  file.track = track;
  file.save
  track.media_file = file
  track.save
end
