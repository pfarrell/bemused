require 'helpers/root_helper'
class Bemused < Sinatra::Application
  include RootHelper
  get "/" do
    haml :index, locals: {artists: random_artists(25)}
  end
end
