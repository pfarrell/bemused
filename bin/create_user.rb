require './app'
require 'bcrypt'

puts "userid to create"
userid = gets.chomp
puts "password for user"
pass = gets.chomp

pw_crypt = BCrypt::Password.create(pass)

user = User.find(username: userid)

if user then
  puts "User already exists"
else
  user = User.new(username: userid, password: pw_crypt)
  user.save
  puts "Created #{userid}"
end
