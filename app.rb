$: << File.expand_path('../app', __FILE__)

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
  set :views, Proc.new { File.join(root, "app/views") }

  before do
    response.set_cookie(:bmc, value: SecureRandom.uuid, expires: Time.now + 3600 * 24 * 365 * 10) if request.cookies["bmc"].nil?
  end

end

require 'models'
require 'routes'
