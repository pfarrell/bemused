class Playlist < Sequel::Model
  include Editable

  many_to_many :tracks

  def track_list 
    tracks.map.with_index do |track,i| 
      artist_name = track.album.artist.nil? ? "unknown" : track.album.artist.name
      %Q(
        {
          title: "#{i+1}. #{track.title} (#{artist_name})", 
          mp3: "#{ENV["BEMUSED_PATH"]}/stream/#{track.id}"
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
end

