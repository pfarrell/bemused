$: << File.expand_path('../../app', __FILE__)

require 'models'

cnt = 0
cnt_unicode=0
MediaFile.where('discriminator = :disc', disc: 'mp3').each do |f|
  puts "#{f.track.title} #{f.absolute_path}" unless f.track.nil? || File.exists?(f.absolute_path)
  cnt += 1
  cnt_unicode+=1 if f.absolute_path =~ /\?/
end

puts "#{cnt} missing"
puts "#{cnt_unicode} possible munged names"
