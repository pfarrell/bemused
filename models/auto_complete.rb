class AutoComplete
 
   def self.lookup(query)
    res = {"suggestions"=> Artist.where(Sequel.ilike(:name, "%#{query}%")).all.select{|x| x.albums.count > 0}.map{|x| {"value"=>"#{x.name}"}}}
    Album.where(Sequel.ilike(:title, "%#{query}%")).all.select{|x| x.tracks.count > 0}.each {|x| res["suggestions"] << {"value"=>"#{x.title}"}}
    ["/tracks","/playlists", "/upload", "/rand", "/logs"].select{|x| x =~ /.*#{query}.*/}.each{|x| res["suggestions"] << {"value" => x}}
    res
   end
end

