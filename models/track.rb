class Track < Sequel::Model
  include Editable

  many_to_one :album
  one_to_one  :media_file
  many_to_one :artist
  one_to_many :logs
  many_to_many :playlists

end
