module RootHelper
  def random_artists(size)
    artists = context? ? Artist.where(tags: @tags) : Artist
    Artist.from(
      artists
        .join(:albums, artist_id: :id)
        .exclude(image_path: nil)
        .qualify
        .select_all(:artists)
        .distinct
    )
    .select_append(Sequel.lit('RANDOM() as random_order'))
    .order(:random_order)
    .limit(size)
  end

  def artists_with_albums(query)
    Artist.where(Sequel.ilike(Sequel.function(:f_unaccent, Sequel.function(:lower, :name)), "%#{query}%"))
        .join(:albums, artist_id: :id)
        .qualify
        .distinct(:id)
  end

  def albums_with_tracks(query)
    Album.where(Sequel.ilike(Sequel.function(:f_unaccent, Sequel.function(:lower, :title)), "%#{query}%"))
      .join(:tracks, album_id: :id)
      .qualify
      .distinct(:id)
  end

  def tracks_from_search(query)
    #count = Track.where(Sequel.ilike(Sequel.function(:f_unaccent, :title), "%#{query}%")).count
    tracks = Track.where(Sequel.ilike(Sequel.function(:f_unaccent, Sequel.function(:lower, :title)), "%#{query}%")).limit(20)
    count = tracks.count
    return {count: count, tracks: tracks}
  end
end
