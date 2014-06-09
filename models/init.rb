require 'sequel'

DB = Sequel.connect('mysql://root:root@localhost/pshare')

require_relative 'track'
require_relative 'album'
require_relative 'pfile'
require_relative 'artist'
