class Album < Sequel::Model
  include Editable

  many_to_one :artist
  one_to_many :tracks
  one_to_many :logs

  # returns tracks formatted as string of form
  # {title: "${track_number}. ${track_title}", mp3: "${path to mp3 (in public folder}"}, ...
  def playlist 
    tracks.sort_by{ |t| t.track_number.to_i }.map do |track| 
      artist_name = track.artist.nil? ? track.album.artist.name : track.artist.name
      %Q(
        {
          title: "#{track.track_number.gsub(/\/.*/, "")}. #{track.title}", 
          mp3: "#{ENV["BEMUSED_PATH"]}/stream/#{track.id}",
          artist: "#{artist_name}"
        }
      )
    end
    .join(',')
  end

  def to_s
    self.title
  end
  
  def image
    self.image_path == "" ? "artists/#{self.artist.image_path}" : self.image_path
  end
end

