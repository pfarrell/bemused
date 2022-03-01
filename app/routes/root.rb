require 'helpers/root_helper'
require 'jwt'

class Bemused < Sinatra::Application
  include RootHelper
  get "/" do
    haml :index, locals: {artists: random_artists(66)}
  end

  get "/resume" do
    if current_user
      redirect url_for(Resume.latest(current_user.id).location)
    else
      redirect url_for "/"
    end
  end

  get "/login" do
    haml :login
  end

  post "/login" do

    if(params['username'] and params['password']) then
      exp = Time.now.to_i + 4*3600 # four hours in future
      payload = {name: 'Pat', username: params['username'], exp: exp}
      token = JWT.encode payload, ENV['BEMUSED_JWT_SECRET'], 'HS256'
      cookies[:auth] = token
    end
    redirect url_for "/"
  end

  get "/logout" do
  end

  get "/profile" do
  end

end
