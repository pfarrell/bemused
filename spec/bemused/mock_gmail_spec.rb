require 'spec_helper'

describe MockGmail do
  let(:email) { "test@example.com" }
  let(:token) { Token.new }

  context "#find" do
    it "provides connecttons" do
      MockGmail.connect("user", "pass") do |x|
        expect(x).to be_a MockConnection
      end
    end
  end

  context "#send_login" do
    it "delvers mail with a block"do
      t=false
      MockGmail.send_login(email, token) {t=true}
      expect(t).to eq(true)
    end
  end
end

describe MockConnection do
  let(:connection) { MockConnection.new }
  context "#deliver" do
    it "delvers mail"do
      expect(connection.deliver).to eq(true)
    end
  end
end

