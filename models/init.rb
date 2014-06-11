require 'sequel'

DB = Sequel.connect("mysql://#{ENV["BEMUSED_DB_USER"]}:#{ENV["BEMUSED_DB_PASS"]}@#{ENV["BEMUSED_DB_HOST"]}/#{ENV["BEMUSED_DB_DB"]}")

require_relative 'track'
require_relative 'album'
require_relative 'pfile'
require_relative 'artist'
