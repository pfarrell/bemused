require 'spec_helper'

describe User do
  let(:email) { 'test@example.com' }
  let(:username) { 'testuser' }

  before do
    post "/user", {email: email, username: username}
  end

  it "creates users" do
    json= JSON.parse(last_response.body)
    user = json['user']
    token = json['token']

    expect(user['email']).to eq(email)
    expect(user['username']).to eq(username)
    expect(token['token']).to_not be_nil
  end

  context "#login" do

    before do
      post "/user", {email: email, username: username}
    end

    it "logs in users with valid tokens" do
      json= JSON.parse(last_response.body)
      user = json['user']
      token = json['token']

      get "/user/login/#{token['token']}"
    end

    it "fails on invalid tokens" do
      begin
        get "/user/login/#{SecureRandom.hex}"
      rescue Exception=>ex
        expect(ex).to be_a(RuntimeError)
      end
    end
  end
end
