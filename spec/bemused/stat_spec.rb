require 'spec_helper'

describe Stat do
  let(:stat) { Stat.new(Object.new) }

  context '#new' do
    it 'is initialized with a type' do
      expect(stat.type).to eq("Object")
    end
  end

  context '#values' do
    it 'has a hash for properties' do
      expect(stat.values).to be_a Hash
    end
  end

  context '#to_json' do
    it 'converts to json' do
      expect(stat.to_json).to eq ('{"type":"Object","props":{}}')
    end
  end
end
