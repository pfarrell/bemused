class Bemused < Sinatra::Applicaion
  get '/album/:id/tags' do
    Album[params[:id]].tags.to_json
  end

  get '/artist/:id/tags' do
    Artist[params[:id]].tags.to_json
  end

  get '/tag/:id' do
    Tag[params[:id]]
  end
end
