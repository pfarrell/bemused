Sequel.migration do
  change do
    create_table(:albums_artists) do
      primary_key :id
      Integer :album_id
      Integer :artist_id
      DateTime :created_at
      DateTime :updated_at
    end
  end
end
