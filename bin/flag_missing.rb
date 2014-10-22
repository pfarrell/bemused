$: << File.expand_path('../../app', __FILE__)

require 'models'

MediaFile.where('discriminator = :disc', disc: 'mp3').each do |f|
  puts f.absolute_path unless File.exists?(f.absolute_path)
end
