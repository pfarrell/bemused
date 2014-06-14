require 'sinatra'
require 'sinatra/url_for'
require 'haml'
require 'logger'

class Bemused < Sinatra::Application
  helpers Sinatra::UrlForHelper

  enable :sessions
  set :session_secret, ENV["BEMUSED_SESSION_SECRET"]


end

require_relative 'models/init'
#require_relative 'helpers/init'
require_relative 'routes/init'
