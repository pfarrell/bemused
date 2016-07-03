require 'spec_helper'

describe 'Messaging' do
  let(:subject) { Messaging.new(MockGmail) }

  context 'send_login' do
    it 'sends login tokens' do
      subject.send_login('test@example.com', '12345')
    end
  end

  context 'connect' do
    it 'connects to argued service type: MockGmail' do
      subject.connect do |connection|
        expect(connection).to be_a MockConnection
      end
    end
  end
end
