class Artist < Sequel::Model
  one_to_many :albums
  one_to_many :tracks
end

