class Favorite < Sequel::Model
  plugin :single_table_inheritance, :kind
end

class FavoriteTrack < Favorite
  many_to_one :track, key: :target_id
end

class FavoriteAlbum < Favorite; end
class FavoriteArtist < Favorite; end
