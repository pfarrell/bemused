class Bemused < Sinatra::Application

  delete '/favorite/:id' do
    Favorite[params[:id]].destroy
  end
end
