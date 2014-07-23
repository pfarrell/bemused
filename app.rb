require 'sinatra'
require 'sinatra/url_for'
require 'rack/mobile-detect'
require 'sinatra/respond_to'
require 'sinatra/cookies'
require 'securerandom'
require 'haml'
require 'logger'

class Bemused < Sinatra::Application
  helpers Sinatra::UrlForHelper
  helpers Sinatra::Cookies
  use Rack::MobileDetect
  register Sinatra::RespondTo

  enable :sessions
  set :session_secret, ENV["BEMUSED_SESSION_SECRET"]

  before do
    response.set_cookie(:bmc, value: SecureRandom.uuid, expires: Time.now + 3600 * 24) if request.cookies["bmc"].nil?
  end

end

require_relative 'models/init'
#require_relative 'helpers/init'
require_relative 'routes/init'
