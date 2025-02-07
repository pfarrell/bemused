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
    return if s.summary.nil?
    arr = s.summary.split('. ')
    sum = arr.length > 4 ? arr[0..3].join('. ') : s.summary
    s.summary.nil? ? nil : { summary: sum, url: s.fullurl }.to_json
  end

end
