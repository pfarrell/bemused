class Playlist < Sequel::Model
  include Editable

  many_to_many :tracks

  def track_list 
    tracks.sort_by{|t| t.id}.map.with_index do |track,i|
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
    Track.order{rand{}}.limit(size).each_with_index do |track, i| 
      track.track_number = i + 1
      playlist.tracks << track
    end
    playlist
  end

  def self.recent(size=10)
    playlist = Playlist.new()
    playlist.name = "Recent Additions"
    playlist.image_path="nursery.jpg"
    Track.order(Sequel.desc(:created_at)).limit(size).each_with_index do |track, i|
      track.track_number = i + 1
      playlist.tracks << track
    end
    playlist
  end

  def self.single(name)
    playlist = Playlist.new()
    playlist.name=(name)
    playlist.image_path="radio.jpg"
    playlist.tracks << Track.random.first
    playlist
  end

  def random_image
    tracks.sample.album.image_path 
  end
end

