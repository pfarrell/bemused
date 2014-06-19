class MediaFile < Sequel::Model
  include Editable

  one_to_one :track
end
