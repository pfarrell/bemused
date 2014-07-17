class Bemused < Sinatra::Application
  get "/search" do
    query = params[:q]
    redirect(url_for("/#{query[2..-1]}")) if query =~ /^>>/
    redirect(url_for("/")) if query.nil? || query.length < 2
    haml :search, locals: {
      :albums => Album.where(Sequel.ilike(:title, "%#{query}%")),
      :artists => Artist.where(Sequel.ilike(:name, "%#{query}%"))
    }
  end
end
