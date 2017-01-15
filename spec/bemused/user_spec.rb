require 'spec_helper'

describe User do
  let(:token) {
    "eyJ1c2VyX2lkIjoiMzZmNDExOWZhYjk2IiwidG9rZW4iOiIzMmEzZjA1N2Y0MmMzMzFkZDE0NzQwNDFkYzhmMDMyMCIsInByb2ZpbGVfdXJsIjoiaHR0cDovL2xvY2FsaG9zdDo5MjkyL3VzZXIvMSIsImxvZ291dF91cmwiOiJodHRwOi8vbG9jYWxob3N0OjkyOTIvYXBwbGljYXRpb24vMy9sb2dvdXQiLCJuYW1lIjoiUGF0cmljayJ9"
  }

  let(:user) { User.new(token) }

  it 'has an id' do
    expect(user.id).to eq('36f4119fab96')
  end

  it 'has a token' do
    expect(user.token).to eq('32a3f057f42c331dd1474041dc8f0320')
  end

  it 'has a profile_url' do
    expect(user.profile_url).to eq('http://localhost:9292/user/1')
  end

  it 'has a logout_url' do
    expect(user.logout_url).to eq('http://localhost:9292/application/3/logout')
  end

  it 'has a name' do
    expect(user.name).to eq('Patrick')
  end

end
