require 'helpers/root_helper'
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
end
