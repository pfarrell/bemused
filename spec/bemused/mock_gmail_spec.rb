require 'spec_helper'

describe MockGmail do
  context "#find" do
    it "provides connecttons" do
      MockGmail.connect("user", "pass") do |x|
        expect(x).to be_a MockConnection
      end
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

