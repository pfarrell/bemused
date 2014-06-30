Sequel.migration do
  change do
    create_table(:logs) do
      primary_key :id
      Integer :artist_id
      Integer :album_id
      Integer :track_id
      String :action
      DateTime :created_at
      DateTime :updated_at
    end
  end
end
