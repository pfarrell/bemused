class AutoComplete
 
  def self.lookup(query)
    res = {"suggestions"=> Artist.where(Sequel.ilike(:name, "%#{query}%")).all.select{|x| x.albums.count > 0}.map{|x| {"value"=>"#{x.name}"}}}
    Album.where(Sequel.ilike(:title, "%#{query}%")).all.select{|x| x.tracks.count > 0}.each {|x| res["suggestions"] << {"value"=>"#{x.title}"}}
    #Playlist.where(Sequel.ilike(:name, "%#{query}%")).all.select{|x| x.tracks.count > 0}.each {|x| res["suggestions"] << {"value"=>"#{x.name}"}}
    ["/active",
     "/albums/recent",
     "/albums/words",
     "/logs",
     "/newborns",
     "/playlists",
     "/radio",
     "/random",
     "/surprise",
     "/top",
     "/tracks",
     "/tracks/words",
     "/track_paths",
     "/upload"
     ].select{|x| x =~ /.*#{query}.*/}.each{|x| res["suggestions"] << {"value" => x}}
    res
  end

  def self.translate(query)
    lkup={"t"=>"/tracks",
     "p"=>"playlists", 
     "u"=>"upload", 
     "r"=>"random", 
     "l"=>"logs", 
     "s"=>"surprise", 
     "a"=>"active", 
     "n"=>"newborns"} 
     return lkup[query].nil? ? query : lkup[query]
   end

  def self.tracks(query)
    {"suggestions"=> Track.where(Sequel.ilike(:title, "%#{query}%")).all.map{|x| {"value"=>"#{x.title}"}}}
  end

  def self.albums(query)
    {"suggestions"=> Album.where(Sequel.ilike(:title, "%#{query}%")).all.map{|x| {"value"=>"#{x.title}"}}}
  end

  def self.artists(query)
    {"suggestions"=> Artist.where(Sequel.ilike(:name, "%#{query}%")).all.map{|x| {"value"=>"#{x.name}"}}}
  end

end

