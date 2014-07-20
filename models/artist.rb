class Artist < Sequel::Model
  include Editable

  one_to_many :albums
  one_to_many :tracks
  one_to_many :logs

  def to_s
    self.name
  end
end

