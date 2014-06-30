class Log < Sequel::Model
  include Editable

  many_to_one :album
  many_to_one :artist
  many_to_one :track
end
