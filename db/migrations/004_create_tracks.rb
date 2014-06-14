Sequel.migration do
  change do
    create_table(:tracks) do
      primary_key :id
      String :title
      String :track_number
      String :release_year
      Fixnum :album_id
      Fixnum :artist_id
      Fixnum :media_file_id
      DateTime :created_at
      DateTime :updated_at
    end
  end
end
