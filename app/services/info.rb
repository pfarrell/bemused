require 'json'

class Info
  @cache={}

  def self.retrieve(subject)
    @cache[subject] = Wikipedia.find(subject) unless @cache.has_key?(subject)
    @cache[subject]
  end

  def self.summary(subject)
    puts "retrieving #{subject}"
    { summary: retrieve(subject).summary }.to_json
  end

end
