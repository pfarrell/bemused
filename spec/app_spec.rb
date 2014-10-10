require 'spec_helper'

describe 'App' do
  it "should allow access to the home page" do
    get "/"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/cioa, stranger/)
  end

  it "should allow access to the home page with query string" do
    get "/?name=Pat"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/cioa, Pat/)
  end
end
