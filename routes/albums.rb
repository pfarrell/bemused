class Bemused < Sinatra::Application
  get "/album/:id" do
    haml :album, locals: {album: Album[params[:id]]} 
  end

  get "/admin/album/:id" do
    haml :"admin/model", locals: {model: Album[params[:id]]}
  end

  post "/admin/album/:id" do
    album = Album[params[:id]].merge_params(params)
    album.save
    haml :album, locals: {album: album}
  end
end
