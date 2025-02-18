class Track < Sequel::Model
  include Editable
  include Favoritable

  many_to_one :album
  one_to_one  :media_file
  many_to_one :artist
  one_to_many :logs
  many_to_many :tracks

  def self.random(n=1)
    Track.order{Sequel.lit('RANDOM()')}.limit(n)
  end

  def self.active(n=1)
    Log.group_and_count(:track_id)
       .filter('created_at > ?', Date.today - 7)
       .order{Sequel.lit('RANDOM()')}
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
      duration: self.duration_sec,
      image: image,
      url: "#{ENV["BEMUSED_DEV_PATH"]}/stream/#{self.id}",
    }.to_json(opts)
  end

  def image
    return self.album.image_path unless self.album.nil? || self.album.image_path.nil? || self.album.image_path == ""
    return "artists/#{self.artist.image_path}" unless self.artist.nil?
  end

  def duration
    "#{(self.duration_sec / 60).floor}:#{'%02i' % (self.duration_sec % 60)}"
  end

  def self.stats
    stats = Stat.new(self)
    stats.values["count"] = Track.count
    stats.values["most_recent"] = Track.last
    stats
  end
end
