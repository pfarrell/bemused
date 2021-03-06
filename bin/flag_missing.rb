$: << File.expand_path('../../app', __FILE__)
require 'models'

cnt = 0
cnt_unicode=0
cnt_share2=0
MediaFile.where('discriminator = :disc', disc: 'mp3').each do |f|
  $stderr.puts "#{f.track.title} #{f.absolute_path}" unless f.track.nil? || File.exists?(f.absolute_path)
  cnt += 1
  cnt_unicode+=1 if f.absolute_path =~ /\?/
  cnt_share2+=1 if f.absolute_path =~ /share2/
end

puts "#{cnt} missing"
puts "#{cnt_unicode} possible munged names"
puts "#{cnt_share2} possible shared names"
