class Log < Sequel::Model
  include Editable

  many_to_one :album
  many_to_one :artist
  many_to_one :track

  def self.stats
    stats = Stat.new(self)
    stats.values = Hash.new{|h,k| h[k] = {}}
    stats.values[:all_time][:count] = Log.count
    stats.values[:all_time][:popular] = Log.group_and_count(:track_id).order_by(:count).reverse.first(10).map{|log| track = Track[log[:track_id]]; [track, track.artist, log[:count]]}
    stats.values[:one_month][:popular] = Log.where{created_at > (Date.today - 30).iso8601}.group_and_count(:track_id).order_by(:count).reverse.first(10).map{|log| track = Track[log[:track_id]]; [track, track.artist, log[:count]]}
    stats.values[:one_week][:popular] = Log.where{created_at > (Date.today - 7).iso8601}.group_and_count(:track_id).order_by(:count).reverse.first(10).map{|log| track = Track[log[:track_id]]; [track, track.artist, log[:count]]}
    stats
  end
end
