class Tag < Sequel::Model
  include Editable

  many_to_many :artists
  many_to_many :albums
  many_to_many :tracks

end

