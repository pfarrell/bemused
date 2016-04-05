class Bemused < Sinatra::Application

  get "/album/:id/summary" do
    Info.summary(Album[params[:id]].title)
  end

  get "/summary/:search" do
    Info.summary(params[:search])
  end

end
