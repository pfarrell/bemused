class Track < Sequel::Model
  include Editable

  many_to_one :album
  one_to_one  :media_file
  many_to_one :artist
  one_to_many :logs
  many_to_many :playlists

  def self.random
    Track.order{rand{}}.limit(1)
  end

  def track_artist
    track.album.nil? ? track.artist : track.album.artist
  end

  def to_json(opts={})
    {
      id: self.id,
      title: self.title,
      album: self.album.nil? ? "" : self.album.title,
      artist: self.artist.nil? ? "" : self.artist.name,
      image: self.album.image_path == "" ? "artists/#{self.artist.image_path}" : self.album.image_path,
      mp3: "#{ENV["BEMUSED_PATH"]}/stream/#{self.id}",
      free: false
    }.to_json(opts)
  end

end
