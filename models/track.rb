class Track < Sequel::Model
  include Editable

  many_to_one :album
  one_to_one  :media_file
  many_to_one :artist
end
