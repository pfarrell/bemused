module RootHelper
  def random_artists(size)
    artists = context? ? Artist.where(tags: @tags) : Artist
    artists
      .join(:albums, id: :id)
      .exclude(image_path: nil)
      .qualify
      .order(Sequel.lit('RANDOM()'))
      .limit(size)
  end
end
