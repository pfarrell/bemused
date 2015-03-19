class Track < Sequel::Model
  include Editable

  many_to_one :album
  one_to_one  :media_file
  many_to_one :artist
  one_to_many :logs

  def self.random(n=1)
    Track.order{rand{}}.limit(n)
  end

  def self.active(n=1)
    Log.group_and_count(:track_id)
       .filter('created_at > ?', Date.today - 7)
       .order{rand{}}
       .limit(n).map do |x| 
      Track[x.track_id]
    end.select{ |x| !x.nil? }
  end

  def track_artist
    self.album.nil? ? self.artist : self.album.artist
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
