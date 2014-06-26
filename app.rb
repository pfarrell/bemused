require 'sinatra'
require 'sinatra/url_for'
require 'rack/mobile-detect'
require 'sinatra/respond_to'
require 'haml'
require 'logger'

class Bemused < Sinatra::Application
  helpers Sinatra::UrlForHelper
  use Rack::MobileDetect
  register Sinatra::RespondTo

  enable :sessions
  set :session_secret, ENV["BEMUSED_SESSION_SECRET"]


end

require_relative 'models/init'
#require_relative 'helpers/init'
require_relative 'routes/init'
