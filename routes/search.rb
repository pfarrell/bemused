class Bemused < Sinatra::Application
  get "/search" do
    query = params[:q]
    haml :search, locals: {
      :albums => Album.where(Sequel.ilike(:title, "%#{query}%")),
      :artists => Artist.where(Sequel.ilike(:name, "%#{query}%"))
    }
  end
end
