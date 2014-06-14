Sequel.migration do
  change do
    create_table(:albums) do
      primary_key :id
      String :title
      String :release_year
      Fixnum :artist_id
      Fixnum :disc_number
      Fixnum :genre_id
      String :image_path
      DateTime :created_at
      DateTime :updated_at
    end
  end
end
