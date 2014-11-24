#! /usr/bin/env ruby

require 'id3tag'
require 'redis'
require 'json'
require '../app'

def coalesce(first, second)
  return first unless first.nil? || first == ""
  return second
end

redis = Redis.new

#while(redis.llen('bemused:incoming') > 0)
while(true)
  list, json = redis.blpop('bemused:incoming')
  hsh = JSON.parse(json)
  mp3 = Mp3.new(hsh["file_name"])

  #Read tags
  tags = mp3.tags
  track_artist_name = coalesce tags.artist, hsh["artist_name"]
  album_artist_name = coalesce hsh["artist_name"], tags.artist
  album_name = coalesce hsh["album_name"], tags.album
  src= hsh["file_name"]
  
  # mv to error dir if no tags, add to error queue

  # mv to nas if tagged
  nas_location = "#{ENV["BEMUSED_UPLOAD_BASE"]}#{album_artist_name}/#{album_name}/#{File.basename(mp3.tags.source)}".gsub(/[ ]*:/, "").gsub(/[\(\)\?\"]/, "")

  FileUtils.mkdir_p(File.dirname(nas_location))
  begin
    FileUtils.mv(src, nas_location, verbose: true)
  rescue Exception
  end

  
  track_artist = Artist.find_or_create(name: track_artist_name)
  album_artist = Artist.find_or_create(name: album_artist_name)
  album = Album.find_or_create(artist: album_artist, title: album_name)
  track = Track.find_or_create(artist: track_artist, album: album, title: tags.title, track_number: tags.track_nr)
  track.track_number = tags.track_nr
  track.save
  file = MediaFile.find_or_create(absolute_path: nas_location)
  file.track = track;
  file.save
  track.media_file = file
  track.save
end
