class Album < Sequel::Model
  many_to_one :artist
  one_to_many :tracks

  # returns tracks formatted as string of form
  # {title: "${track_number}. ${track_title}", mp3: "${path to mp3 (in public folder}"}, ...
  def playlist 
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
end

