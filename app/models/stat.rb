class Stat
  attr_accessor :type, :count, :most_recent, :popular
  def initialize(obj)
    @type = obj.name
  end

  def to_json(opts={})
    {type: @type, count: @count, most_recent: @most_recent}.to_json(opts)
  end
end
