$: << File.expand_path('../app', __FILE__)

require 'sinatra'
require 'sinatra/url_for'
require 'sinatra/param'
require 'rack/mobile-detect'
require 'sinatra/respond_with'
require 'sinatra/cookies'
require 'sinatra/cross_origin'
require 'securerandom'
require 'haml'
require 'logger'
require 'wikipedia'
require 'digest'


require 'modules'
require 'models'
require 'routes'
require 'services'
require 'jwt'

class Bemused < Sinatra::Application
  helpers Sinatra::UrlForHelper
  helpers Sinatra::Cookies
  helpers Sinatra::Param
  use Rack::MobileDetect
  register Sinatra::RespondWith

  enable :sessions
  set :session_secret, ENV["BEMUSED_SESSION_SECRET"]
  set :views, Proc.new { File.join(root, "app/views") }
  set :local_authority, 'http://192.168.0.47' # for Sinatra::LocalApp
  set :bind, '0.0.0.0'

  set :user_cache, {}

  helpers do

    def user_tags
      request.cookies['tags'].nil? ? [] : request.cookies['tags'].split('&').map{|id| Tag[id] }
    end

    def context?
      !user_tags.empty?
    end

    def current_user
      token = request.cookies["auth"]

      begin
        if token then
          decoded = JWT.decode token, ENV['BEMUSED_JWT_SECRET'], 'HS256'
          return settings.user_cache[decoded] if settings.user_cache[decoded]
          user = User.find(id: decoded[0]['id'])
          settings.user_cache[decoded] = user
        end
      rescue
      end
      user
    end

    def order_tracks(tracks)
      tracks.sort_by{ |t| t.track_number.to_i }
    end

    def resumeable?(location)
      patterns = [
        /^\/$/,
        /^\/resume$/,
        /\/summary$/,
        /\/stream\//,
        /\/log\//,
        /\/images\//,
        /^\/livesearch$/,
        /^\/search$/,
        /\/favorite$/
      ]
      unioned_regex = Regexp.union(patterns)
      not location.match(unioned_regex)
    end
  end

  configure do
    info = development? || test? ? Wikipedia : ::Wikipedia
    set :info, Info.new(info)
    enable :cross_origin
  end

  before do
    #response.set_cookie(:bmc, value: SecureRandom.uuid, expires: Time.now + 3600 * 24 * 365 * 10) if request.cookies["bmc"].nil?
    @tags = user_tags
    Resume.log_location(current_user.id, request.path) if current_user && resumeable?(request.path)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
  end

  not_found do
    puts "#{request.request_method} #{request.path}"
    haml :hunh
  end
end
