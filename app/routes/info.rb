class Bemused < Sinatra::Application

  get "/album/:id/summary" do
    album = Album[params[:id]]
    title = album.wikipedia || album.title
    Info.summary(title)
  end

  get "/summary/:search" do
    Info.summary(params[:search])
  end

end
