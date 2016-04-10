class Tag < Sequel::Model

  many_to_many :artists
  many_to_many :albums
  many_to_many :tracks

end

