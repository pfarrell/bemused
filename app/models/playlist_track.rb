class PlaylistTrack < Sequel::Model
  include Editable
  many_to_one :playlist
  many_to_one :track
end
