module RootHelper
  def random_artists(size)
    artists = Artist
      .join(:albums, artist_id: :id)
      .exclude(Sequel[:artists][:image_path] => nil)
      .select_all(:artists)
      .select_append(Sequel.function(:row_number).over(partition: Sequel[:artists][:id], order: Sequel.function(:random)).as(:rn))
      .from_self
      .where(rn: 1)
      .order(Sequel.function(:random))
      .limit(size)
    artists.map do |artist|
      artist.values.delete(:rn)
      artist
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
