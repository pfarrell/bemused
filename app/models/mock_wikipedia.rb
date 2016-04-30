class MockWikipedia
  def self.find(str)
    raise 'mocked exception' if str=='raise'
    return nil if str =~ /return nothing/
    return MockPage.new
  end
end

class MockPage
  def summary
    return 'page summary'
  end

  def fullurl
    return 'http://example.com'
  end
end
