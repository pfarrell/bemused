class PlaylistTrack < Sequel::Model
  many_to_one :playlist
  many_to_one :track
end
