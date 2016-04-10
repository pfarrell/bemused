require 'sequel'
require 'redis'
require 'logger'

$console = ENV['RACK_ENV'] == 'development' ? Logger.new(STDOUT) : nil
DB = Sequel.connect(
  ENV['BEMUSED_DB'] || 'postgres://localhost/bemused',
  logger: $console,
  test: true
)

DB.sql_log_level = :debug
DB.extension(:pagination)
DB.extension(:pg_array, :pg_json)
DB.extension(:connection_validator)

DB.pool.connection_validation_timeout = 300

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
require 'models/playlist_track'
require 'models/mock_wikipedia'
require 'models/tag'
