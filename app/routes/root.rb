require 'helpers/root_helper'
class Bemused < Sinatra::Application
  include RootHelper
  get "/" do
    haml :index, locals: {artists: random_artists(66)}
  end
end
