class Favorite < Sequel::Model
  plugin :single_table_inheritance, :kind
end

class FavoriteTrack < Favorite; end
class FavoriteAlbum < Favorite; end
class FavoriteArtist < Favorite; end
