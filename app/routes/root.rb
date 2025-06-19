require 'helpers/root_helper'
require 'jwt'
require 'bcrypt'

class Bemused < Sinatra::Application
  include RootHelper
  get "/" do
    data = {artists: random_artists(60)}
    respond_to do |wants|
      wants.json { data.to_json }
      wants.html { haml :index, layout: !request.xhr?, locals: data }
    end
  end
  # Serve the React frontend
  get '/frontend/*' do
    send_file File.join(settings.public_folder, 'frontend', params['splat'].first)
  end

  # Serve the main frontend app
  get '/app' do
    send_file File.join(settings.public_folder, 'frontend', 'index.html')
  end

  get "/resume" do
    if current_user
      redirect url_for(Resume.latest(current_user.id).location)
    else
      redirect url_for "/"
    end
  end

  get "/login" do
    referer = request.referer
    haml :login, layout: !request.xhr?, locals: {referer: referer}
  end

  post "/login" do
    username = params['username']
    password = params['password']
    referer = params['referer']
    user = User.find(username: username)
    if user then
      crypt_pw = BCrypt::Password.new(user.password)
      if(crypt_pw == password) then
        exp = Time.now.to_i + 24*3600 # twenty-four hours in future
        payload = {id: user.id, username: user.username, exp: exp}
        token = JWT.encode payload, ENV['BEMUSED_JWT_SECRET'], 'HS256'
        cookies[:auth] = token
      end
    end
    redirect referer
  end

  get "/logout" do
    cookies[:auth] = nil
    redirect request.referer
  end

  get "/profile" do
    haml "hello", layout: !request.xhr?
  end

end
