module RootHelper
  def random_artists(size)
    artists = context? ? Artist.where(tags: @tags) : Artist
    artists
      .join(:albums, artist_id: :id)
      .exclude(image_path: nil)
      .qualify
      .order(Sequel.lit('RANDOM()'))
      .limit(size)
  end

  def artists_with_albums(query)
      Artist.where(Sequel.ilike(:name, "%#{query}%"))
        .join(:albums, artist_id: :id)
        .qualify
        .distinct(:id)
  end

  def albums_with_tracks(query)
    Album.where(Sequel.ilike(:title, "%#{query}%"))
      .join(:tracks, album_id: :id)
      .qualify
      .distinct(:id)
  end

  def tracks_from_search(query)
    count = Track.where(Sequel.ilike(:title, "%#{query}%")).count
    tracks = Track.where(Sequel.ilike(:title, "%#{query}%")).limit(20)
    return {count: count, tracks: tracks}
  end
end
