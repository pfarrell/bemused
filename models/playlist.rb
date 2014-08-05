class Playlist < Sequel::Model
  include Editable

  many_to_many :tracks

  def track_list 
    tracks.sort_by{ |t| t.track_number.to_i }.map do |track| 
      %Q(
        {
          title: "#{track.track_number}. #{track.title}", 
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
    Track.order{rand{}}.limit(size).each{|track| playlist.tracks << track}
    playlist
  end
end

