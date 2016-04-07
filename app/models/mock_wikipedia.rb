class MockWikipedia
  def self.find(str)
    raise 'mocked exception' if str=='raise' 
    return MockPage.new
  end
end

class MockPage
  def summary
    return 'page summary'
  end
end
