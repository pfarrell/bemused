class Track < Sequel::Model
  many_to_one :album
  one_to_one  :media_file
  many_to_one :artist
end
