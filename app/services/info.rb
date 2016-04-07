require 'json'

class Info
  attr_accessor :klass

  def initialize(klass)
    @klass = klass
    @cache = {}
  end

  def retrieve(subject)
    @cache[subject] = @klass.find(subject) unless @cache.has_key?(subject)
    @cache[subject]
  end

  def summary(subject)
    puts "retrieving #{subject}"
    { summary: retrieve(subject).summary }.to_json
  end

end
