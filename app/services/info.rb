require 'json'

class Info
  attr_accessor :klass

  def initialize(klass)
    @klass = klass
    @cache = Hash.new{|h,k| h[k] = Hash.new}
  end

  def retrieve(category, subject)
    @cache[category][subject] = @klass.find(subject) unless @cache[category].has_key?(subject)
    @cache[category][subject]
  end

  def summary(category, subject)
    puts "retrieving #{category} #{subject}"
    { summary: retrieve(category, subject).summary }.to_json
  end

end
