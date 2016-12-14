require 'json'

class Info
  attr_accessor :klass

  def initialize(klass)
    @klass = klass
    @cache = Hash.new{|h,k| h[k] = Hash.new}
  end

  def retrieve(category, subject)
    return @cache[category][subject] if @cache[category].has_key?(subject)
    summary = @klass.find(subject)
    @cache[category][subject] = summary unless summary.summary.nil?
    summary
  end

  def summary(category, subject)
    s = retrieve(category, subject)
    s.summary.nil? ? nil : { summary: s.summary, url: s.fullurl }.to_json
  end

end
