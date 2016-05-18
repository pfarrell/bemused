require 'spec_helper'

describe Log do

  context '#stats' do
    it 'has a stats class method' do
      expect(Log.stats).to_not be_nil
    end
  end
end
