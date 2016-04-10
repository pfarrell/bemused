#!/usr/bin/env ruby

require './app'

def update_albums(artist, tag)
  Album.where(artist: artist).each do |album|
    album.add_tag tag
    album.save
  end
end

tag = Tag.find_or_create(name: 'rebecca')
STDIN.read.split("\n").each do |a|
  #raise a if a.split(',').size > 2
  id,name = a.split(',')
  artist = Artist[id]
  artist.add_tag tag
  artist.save
  update_albums(artist, tag)
end


