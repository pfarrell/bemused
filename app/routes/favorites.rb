class Bemused < Sinatra::Application

  get '/favorites' do
    size = params[:size] || "25"
    haml :playlist, locals: {playlist: Playlist.favorites(size.to_i)}
  end

  delete '/favorite/:id' do
    Favorite[params[:id]].destroy
  end
end
