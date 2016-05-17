class Log < Sequel::Model
  include Editable

  many_to_one :album
  many_to_one :artist
  many_to_one :track

  def self.stats
    stats = Stat.new(self)
    stats.count = Log.count
    stats.popular = Log.where{created_at > (Date.today - 60).iso8601}.group_and_count(:track_id).order_by(:count).reverse.first(10).map{|log| [Track[log[:track_id]], log[:count]]}
    stats
  end
end
