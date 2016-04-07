$: << File.expand_path('../app', __FILE__)

require 'sinatra'
require 'sinatra/url_for'
require 'sinatra/presence'
require 'rack/mobile-detect'
require 'sinatra/respond_to'
require 'sinatra/cookies'
require 'securerandom'
require 'haml'
require 'logger'
require 'wikipedia'


require 'models'
require 'routes'
require 'services'

class Bemused < Sinatra::Application
  helpers Sinatra::UrlForHelper
  helpers Sinatra::Cookies
  use Rack::MobileDetect
  register Sinatra::RespondTo
  register Sinatra::Presence

  enable :sessions
  set :session_secret, ENV["BEMUSED_SESSION_SECRET"]
  set :views, Proc.new { File.join(root, "app/views") }
  set :local_authority, 'http://192.168.0.47' # for Sinatra::LocalApp

  configure do
    klass = ENV['RACK_ENV'] == 'test'? MockWikipedia : ::Wikipedia
    set :info, Info.new(klass)
  end

  before do
    response.set_cookie(:bmc, value: SecureRandom.uuid, expires: Time.now + 3600 * 24 * 365 * 10) if request.cookies["bmc"].nil?
  end

  not_found do
    haml :hunh
  end
end
