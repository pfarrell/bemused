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

  def self.included(base)
    base.extend(ClassMethods)
  end

  module ClassMethods

    def words(size=100, field=nil, &block)
      hsh = Hash.new(0)
      self.select(field)
        .all
        .each{|r| r[field].split(' ')
        .each{|w| hsh[w.downcase.strip.gsub(/[^A-Za-z0-9]/,'')]+=1} unless r[field].nil?}
      data = hsh.sort_by{|k,v| v * -1}.first(size.to_i)
    end
  end
end
