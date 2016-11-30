class AutoComplete

  def self.lookup(query)
    res = {"suggestions"=> Artist.where(Sequel.ilike(:name, "%#{query}%")).all.select{|x| x.albums.count > 0}.map{|x| {"value"=>"#{x.name}", "data"=> "#{x.id}", "type"=>"artist"}}}
    Album.where(Sequel.ilike(:title, "%#{query}%")).all.select{|x| x.tracks.count > 0}.each {|x| res["suggestions"] << {"value"=>"#{x.title}", "data"=> "#{x.id}", "type"=>"album"}}
    Playlist.where(Sequel.ilike(:name, "%#{query}%")).all.each {|x| res["suggestions"] << {"value"=>"#{x.name}", "data"=> "#{x.id}", "type"=>"playlist"}}
    ["/active",
     "/albums/recent",
     "/albums/words",
     "/logs",
     "/meta",
     "/newborns",
     "/playlists",
     "/radio",
     "/random",
     "/stats",
     "/surprise",
     "/tags",
     "/top",
     "/tracks",
     "/tracks/words",
     "/track_paths",
     "/upload"
     ].select{|x| x =~ /.*#{query}.*/i}.each{|x| res["suggestions"] << {"value" => x}}
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
    {"suggestions"=> Track.where(Sequel.ilike(:title, "%#{query}%")).all.map{|x| {"value"=>"#{x.title}", "data"=>"#{x.id}"}}}
  end

  def self.albums(query)
    {"suggestions"=> Album.where(Sequel.ilike(:title, "%#{query}%")).all.map{|x| {"value"=>"#{x.title}", "data"=>"#{x.id}"}}}
  end

  def self.artists(query)
    {"suggestions"=> Artist.where(Sequel.ilike(:name, "%#{query}%")).all.map{|x| {"value"=>"#{x.name}", "data"=>"#{x.id}"}}}
  end

  def self.tags(query)
    {"suggestions"=> Tag.where(Sequel.ilike(:name, "%#{query}%")).all.map{|x| {"value"=>"#{x.name}", "data" => x.id}}}
  end
end

