class User < Sequel::Model
  one_to_many :tokens
  one_to_many :opinions
end
