class Stat
  attr_accessor :type, :values
  def initialize(obj)
    @type = (obj.is_a? Class) ? obj.name : obj.class.name
    @values = {}
  end

  def to_json(opts={})
    {type: @type, props: @values}.to_json(opts)
  end
end
