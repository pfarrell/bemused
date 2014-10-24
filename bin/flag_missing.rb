$: << File.expand_path('../../app', __FILE__)

require 'models'

MediaFile.where('discriminator = :disc', disc: 'mp3').each do |f|
  puts "#{f.track.title} #{f.absolute_path}" unless f.track.nil? || File.exists?(f.absolute_path)
 
end
