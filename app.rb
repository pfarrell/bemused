require 'sinatra'
require 'sinatra/url_for'
require 'haml'

class Bemused < Sinatra::Application
  helpers Sinatra::UrlForHelper

  enable :sessions


end

require_relative 'models/init'
#require_relative 'helpers/init'
require_relative 'routes/init'
