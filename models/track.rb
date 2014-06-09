class Track < Sequel::Model
  many_to_one :album
  one_to_one  :pfile
  many_to_one :artist
end
