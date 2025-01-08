class Album < Sequel::Model
  include Editable

  many_to_one :artist
  one_to_many :tracks, order: :track_number
  one_to_many :logs
  many_to_many :tags

  # returns tracks formatted as string of form
  # {title: "${track_number}. ${track_title}", mp3: "${path to mp3 (in public folder}"}, ...
  def playlist
    tracks.sort_by{ |t| t.track_number.to_i }.each_with_index.map do |track, i|
      track_number = track.track_number.nil? ? i+1 :  track.track_number.gsub(/\/.*/, "")
      artist_name = track.artist.nil? ? track.album.artist.name : track.artist.name
      title = track.title.shrink(40).gsub(/"/, "\\\"")
      %Q(
        {
          title: "#{title}",
          url: "#{ENV["BEMUSED_PATH"]}/stream/#{track.id}",
          artist: "#{artist_name.shrink(25)}"
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

  def self.stats
    stats = Stat.new(self)
    stats.values[:count] = Album.count
    stats
  end
end

