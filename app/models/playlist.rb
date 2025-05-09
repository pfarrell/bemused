class Playlist < Sequel::Model
  include Editable

  one_to_many :playlist_tracks

  def track_list(user=nil)
    tracks = playlist_tracks.sort_by{|x| x.order}.map{|x| x.track}
    tracks.map.with_index do |track,i|
      next if track.nil?
      artist_name = track.album.nil? || track.album.artist.nil? ? "unknown" : track.album.artist.name
      %Q(
        {
          title: "#{track.title}",
          url: "#{ENV["BEMUSED_PATH"]}/stream/#{track.id}",
          artist: "#{artist_name}",
          favorited: "#{track.favorited?(user)}",
          duration: "#{track.duration}",
          id: "#{track.id}"
        }
      )
    end
    .join(',')
  end

  def to_s
    self.name
  end

  def self.surprise(opts={})
    size = opts[:size]&.to_i || 10
    playlist = opts[:persist] ? Playlist.create : Playlist.new
    playlist.auto_generated = true
    playlist.name = "Surprise!!"
    playlist.image_path ="shells.jpg"
    Track.order{Sequel.lit('RANDOM()')}.limit(size).each_with_index do |track, i|
      track.track_number = i + 1
      playlist.add_playlist_track PlaylistTrack.new(track: track)
    end
    playlist.save if opts[:persist]
    playlist
  end

  def self.recent(size=10)
    playlist = Playlist.new()
    playlist.name = "Recent Additions"
    playlist.image_path="nursery.jpg"
    Track.order(Sequel.desc(:created_at)).limit(size).each_with_index do |track, i|
      track.track_number = i + 1
      playlist.playlist_tracks << PlaylistTrack.new(track: track)
    end
    playlist
  end

  def self.favorites(opts={})
    size = opts[:size]&.to_i || 10
    playlist = opts[:persist] ? Playlist.create : Playlist.new
    playlist.auto_generated = true
    playlist.name = "Random Favorites"
    playlist.image_path="nursury.jpg"
    FavoriteTrack.order{Sequel.lit('RANDOM()')}.limit(size).each_with_index do |favorite, i|
      favorite.track.track_number = i + 1
      playlist.add_playlist_track PlaylistTrack.new(track: favorite.track)
    end
    playlist.save if opts[:persist]
    playlist
  end

  def self.single(name)
    playlist = Playlist.new()
    playlist.name=(name)
    playlist.image_path="radio.jpg"
    playlist.playlist_tracks << PlaylistTrack.new(track: Track.random.first)
    playlist
  end

  def random_image
    return if playlist_tracks.empty?
    t = playlist_tracks.sample.track
    (t.nil? || t.album.nil?) ? "" : t.album.image_path
  end
end

