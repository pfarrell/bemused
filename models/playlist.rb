class Playlist < Sequel::Model
  include Editable

  many_to_many :tracks

end
