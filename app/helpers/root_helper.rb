module RootHelper
  def random_artists(size)
    artists = context? ? Artist.where(tags: @tags) : Artist
    artists
      .exclude(image_path: nil)
      .order(Sequel.lit('RANDOM()'))
      .limit(size)
  end
end
