class PlaylistTrack < Sequel::Model
  include Editable
  include Favoritable
  many_to_one :playlist
  many_to_one :track
end
