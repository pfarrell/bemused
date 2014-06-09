class Album < Sequel::Model
  many_to_one :artist
  one_to_many :tracks

  # returns tracks formatted as string of form
  # {title: "${track_number}. ${track_title}", mp3: "${path to mp3 (in public folder}"}, ...
  def playlist 
    tracks.sort_by{ |t| t.track_number }.map do |track| 
      %Q(
        {
          title: "#{track.track_number}. #{track.title}", 
          mp3: "#{ENV["PSHARE_PATH"]}/stream/#{track.id}"
        }
      )
    end
    .join(',')
  end
end

