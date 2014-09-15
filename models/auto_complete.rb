class AutoComplete
 
   def self.lookup(query)
    res = {"suggestions"=> Artist.where(Sequel.ilike(:name, "%#{query}%")).all.select{|x| x.albums.count > 0}.map{|x| {"value"=>"#{x.name}"}}}
    Album.where(Sequel.ilike(:title, "%#{query}%")).all.select{|x| x.tracks.count > 0}.each {|x| res["suggestions"] << {"value"=>"#{x.title}"}}
    Playlist.where(Sequel.ilike(:name, "%#{query}%")).all.select{|x| x.tracks.count > 0}.each {|x| res["suggestions"] << {"value"=>"#{x.name}"}}
    ["/tracks","/playlists", "/upload", "/rand", "/logs", "/surprise", "/top", "/active", "/newborns"].select{|x| x =~ /.*#{query}.*/}.each{|x| res["suggestions"] << {"value" => x}}
    res
   end

   def self.tracks(query)
    {"suggestions"=> Track.where(Sequel.ilike(:title, "%#{query}%")).all.map{|x| {"value"=>"#{x.title}"}}}
   end
end

