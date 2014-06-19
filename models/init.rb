require 'sequel'
require 'logger'
  
$console = Logger.new STDOUT
DB = Sequel.connect(
  "mysql://#{ENV["BEMUSED_DB_USER"]}:#{ENV["BEMUSED_DB_PASS"]}@#{ENV["BEMUSED_DB_HOST"]}/#{ENV["BEMUSED_DB_NAME"]}",
  logger: $console)
DB.sql_log_level = :debug

Sequel::Model.plugin :timestamps

require_relative 'editable'
require_relative 'track'
require_relative 'album'
require_relative 'media_file'
require_relative 'artist'
