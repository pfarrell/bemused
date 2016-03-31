class Playlist < Sequel::Model
  include Editable

  one_to_many :playlist_tracks

  def track_list
    tracks = playlist_tracks.sort_by{|x| x.order}.map{|x| x.track}
    tracks.map.with_index do |track,i|
      next if track.nil?
      artist_name = track.album.nil? || track.album.artist.nil? ? "unknown" : track.album.artist.name
      %Q(
        {
          title: "#{i+1}. #{track.title}",
          mp3: "#{ENV["BEMUSED_PATH"]}/stream/#{track.id}",
          artist: "#{artist_name}"
        }
      )
    end
    .join(',')
  end

  def to_s
    self.name
  end

  def self.surprise(size=10)
    playlist = Playlist.new()
    playlist.name= "Surprise!!"
    playlist.image_path="shells.jpg"
    Track.order{Sequel.lit('RANDOM()')}.limit(size).each_with_index do |track, i|
      track.track_number = i + 1
      playlist.playlist_tracks << PlaylistTrack.new(track: track)
    end
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

  def self.single(name)
    playlist = Playlist.new()
    playlist.name=(name)
    playlist.image_path="radio.jpg"
    playlist.playlist_tracks << PlaylistTrack.new(track: Track.random.first)
    playlist
  end

  def random_image
    album = playlist_tracks.sample.track.album
    album.image_path unless album.nil?
  end
end

