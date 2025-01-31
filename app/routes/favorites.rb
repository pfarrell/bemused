class Bemused < Sinatra::Application

  get '/favorites' do
    size = params[:size] || "25"
    playlist = Playlist.favorites(size: size.to_i, persist: true)
    redirect( url_for("/favorites/#{playlist.id}") )
  end

  get '/favorites/:id' do
    haml :playlist, layout: !request.xhr?, locals: {playlist: Playlist[params[:id].to_i]}
  end

  delete '/favorite/:id' do
    Favorite[params[:id]].destroy
  end
end
