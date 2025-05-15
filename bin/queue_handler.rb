#! /usr/bin/env ruby

require 'id3tag'
require 'redis'
require 'json'
require './app'
require 'mp3info'

def coalesce(first, second)
  return first.strip unless first.nil? || first == ""
  return second ? second.strip : "no tag"
end

def safe_strip(val)
  return val.strip unless val.nil?
  return "not set"
end

def number_or_nil(string)
  Integer(string || '')
rescue ArgumentError
  nil
end

def extract_track_number(tag)
  number = nil
  begin
    number = tag.to_i
  rescue
    stripped_tag = tag.replace(/\/.*/, '')
    number = stripped_tag.to_i
  end
  return number
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
  genre = hsh["genre"]
  track_pad = number_or_nil(hsh["track_pad"]) || 0
  track_number = (extract_track_number(tags.track_nr) + track_pad).to_s

  src= hsh["file_name"]

  # mv to error dir if no tags, add to error queue

  # mv to nas if tagged
  nas_location = "#{ENV["BEMUSED_UPLOAD_PATH"]}/#{album_artist_name}/#{album_name}/#{File.basename(mp3.tags.source)}".gsub(/[ ]*:/, "").gsub(/[\(\)\?\"]/, "")

  FileUtils.mkdir_p(File.dirname(nas_location))
  begin
    FileUtils.mv(src, nas_location, verbose: true)
  rescue Exception
  end

  track_artist_id = number_or_nil(track_artist_name)
  album_artist_id = number_or_nil(album_artist_name)
  album_id = number_or_nil(album_name)

  track_artist = track_artist_id ? Artist[track_artist_id] : Artist.find_or_create(name: track_artist_name)
  album_artist = album_artist_id ? Artist[album_artist_id] : Artist.find_or_create(name: album_artist_name)
  album = album_id ? Album[album_id] : Album.find_or_create(artist: album_artist, title: album_name)
  track = Track.find_or_create(artist: track_artist, album: album, title: safe_strip(tags.title), track_number: track_number)
  track.track_number = track_number
  track.save
  file = MediaFile.find_or_create(absolute_path: nas_location)
  file.track = track;
  file.save
  track.media_file = file
  track.duration_sec = Mp3Info.new(nas_location).length.to_i
  track.save

  unless(genre.nil? || genre == '')
    tag = Tag.find_or_create(name: genre)
    unless(album.tags.include? tag)
      album.add_tag tag
      album.save
    end
    unless(album_artist.tags.include? tag)
      album_artist.add_tag tag
      album_artist.save
    end
  end
end

