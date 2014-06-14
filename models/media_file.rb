class MediaFile < Sequel::Model
  one_to_one :track
end
