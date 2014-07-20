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
end

