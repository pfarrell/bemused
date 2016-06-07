require 'id3tag'

class Mp3
  attr_accessor :file_path

  def initialize(file_path)
    @file_path = file_path
  end

  def import
    ID3Tag.read(File.open(@file_path), :v2) do |tag|
    end
  end

  def tags
    ID3Tag.read(File.open(@file_path)) unless @file_path.nil?
  end
end
