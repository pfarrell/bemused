class Mp3
  attr_accessor :file_path

  def initialize(file_path)
    @file_path = file_path
  end

  def import
    ID3Tag.read(File.open(@file_path), :v2) do |tag|
      puts @file_path
      puts "artis: " +  tag.artist
      puts "title: " + tag.title
      puts "album: " + tag.album
      puts "year:  " + tag.year
      puts "nr:    " +  tag.track_nr
      puts "genre: " + tag.genre
    end
  end

  def tags
    puts @file_path
    puts @file_path.class
    ID3Tag.read(File.open(@file_path)) unless @file_path.nil?
  end
end
