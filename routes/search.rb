require 'json'
class Bemused < Sinatra::Application
  get "/search" do
    query = params[:q]
    redirect(url_for("/#{query[1..-1]}")) if query =~ /^\//
    redirect(url_for("/")) if query.nil? || query.length < 2
    haml :search, locals: {
      :albums => Album.where(Sequel.ilike(:title, "%#{query}%")),
      :artists => Artist.where(Sequel.ilike(:name, "%#{query}%"))
    }
  end

  get "/livesearch" do
    query = params[:q]
    res = {"suggestions"=> Artist.where(Sequel.ilike(:name, "%#{query}%")).map{|x| {"value"=>"#{x.name}"}}}
    Album.where(Sequel.ilike(:title, "%#{query}%")).each {|x| res["suggestions"] << {"value"=>"#{x.title}"}}
    res.to_json
  end
end
