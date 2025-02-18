$: << File.expand_path('../../app', __FILE__)
require 'models'
require 'mp3info'

MediaFile.each do |mf|
  next if mf.track.nil?
  begin
    Mp3Info.open(mf.absolute_path) do |mp3|
      mf.track.duration_sec = mp3.length.to_i
      mf.track.save
    end
  rescue Exception => ex
    puts("error on #{mf.absolute_path} #{ex}")
  end
end
