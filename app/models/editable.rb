module Editable

  def editable_attributes
    self.values.select {|k,v| ![:id,:created_at,:updated_at].include? k}
  end

  def merge_params(params)
    symd = Hash[params.map {|k,v| [k.to_sym, v]}.select{|k,v| ![:id, :splat, :captures, :track_id].include? k}]
    self.values.merge!(symd)
    self
  end

  def log_event(track, album, artist, ip, action, cookie)
    log = Log.new
    log.track = track
    log.artist = artist
    log.album = album
    log.ip_address = ip
    log.action = action
    log.cookie = cookie
    log.save
  end
end
