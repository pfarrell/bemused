require 'spec_helper'

describe MockWikipedia do
  context "#find" do
    it "provides summaries" do
      expect(MockWikipedia.find("test")).to be_a MockPage
    end
  end
end

describe MockPage do
  let(:page) { MockPage.new }
  context "#summary" do
    it "has a summary"do
      expect(page.summary).to eq("page summary")
    end
  end

  context "#fullurl" do
    it "has a url"do
      expect(page.fullurl).to eq("http://example.com")
    end
  end
end

