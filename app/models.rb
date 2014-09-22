require 'sequel'
require 'redis'
require 'logger'
  
$console = Logger.new STDOUT
DB = Sequel.connect(
  "mysql2://#{ENV["BEMUSED_DB_USER"]}:#{ENV["BEMUSED_DB_PASS"]}@#{ENV["BEMUSED_DB_HOST"]}/#{ENV["BEMUSED_DB_NAME"]}",
  logger: $console)
DB.sql_log_level = :debug
DB.extension(:pagination)

Sequel::Model.plugin :timestamps
Sequel::Model.plugin :json_serializer

require 'models/editable'
require 'models/track'
require 'models/album'
require 'models/media_file'
require 'models/artist'
require 'models/mp3'
require 'models/log'
require 'models/playlist'
require 'models/auto_complete'
