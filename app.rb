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
require 'digest'


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

  def user_tags
    request.cookies['tags'].nil? ? [] : request.cookies['tags'].split('&').map{|id| Tag[id] }
  end

  def context?
    !user_tags.empty?
  end

  def current_user
    if request.cookies['bmc'].nil?
       nil
    else
      token = Token.find(token: request.cookies['bmc'])
      token.nil? ? nil : token.user
    end
  end

  def gravatar_hash(email)
     Digest::MD5.hexdigest email.downcase.strip
  end

  configure do
    info = development? || test? ? MockWikipedia : ::Wikipedia
    email = development? || test? ? MockGmail : ::Gmail
    set :info, Info.new(info)
    set :email, Messaging.new(email)
  end

  before do
    #response.set_cookie(:bmc, value: SecureRandom.uuid, expires: Time.now + 3600 * 24 * 365 * 10) if request.cookies["bmc"].nil?
    @tags = user_tags
  end

  not_found do
    puts "#{request.request_method} #{request.path}"
    haml :hunh
  end
end
