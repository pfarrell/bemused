module RootHelper
  def random_artists(size)
#    artists = context? ? Artist.where(tags: @tags) : Artist
#    Artist.from(
#      artists
#        .join(:albums, artist_id: :id)
#        .exclude(image_path: nil)
#        .qualify
#        .select_all(:artists)
#        .distinct
#    )
#    .select_append(Sequel.lit('RANDOM() as random_order'))
#    .order(:random_order)
#    .limit(size)
    artists = Artist
      .join(:albums, artist_id: :id)
      .exclude(Sequel[:artists][:image_path] => nil)
      .select_all(:artists)
      .select_append(Sequel.function(:random).as(:random_order))
      .distinct
      .order(:random_order)
      .limit(size)
    artists.map do |artist|
      values = artist.values.dup
      values.delete(:random_order)
      values
    end
  end

  def artists_with_albums(query)
    Artist.where(Sequel.function(:similarity, Sequel.function(:f_unaccent, Sequel.function(:lower, :name)), "#{query}") > 0.15)
        .join(:albums, artist_id: :id)
        .order(Sequel.desc(Sequel.function(:similarity, Sequel.function(:f_unaccent, Sequel.function(:lower, :name)), "#{query}")))
        .distinct(Sequel.function(:similarity, Sequel.function(:f_unaccent, Sequel.function(:lower, Sequel[:artists][:name])), "#{query}"))
        .qualify
  end

  def albums_with_tracks(query)
    Album.where(Sequel.function(:similarity, Sequel.function(:f_unaccent, Sequel.function(:lower, Sequel[:albums][:title])), "#{query}") > 0.15)
      .join(:tracks, album_id: :id)
      .order(Sequel.desc(Sequel.function(:similarity, Sequel.function(:f_unaccent, Sequel.function(:lower, :title)), "#{query}")))
      .distinct(Sequel.function(:similarity, Sequel.function(:f_unaccent, Sequel.function(:lower, Sequel[:albums][:title])), "#{query}"))
      .qualify
  end

  def tracks_from_search(query)
    #count = Track.where(Sequel.ilike(Sequel.function(:f_unaccent, :title), "%#{query}%")).count
    tracks = Track.where(Sequel.ilike(Sequel.function(:f_unaccent, Sequel.function(:lower, :title)), "%#{query}%")).limit(20)
    count = tracks.count
    return {count: count, tracks: tracks}
  end
end
