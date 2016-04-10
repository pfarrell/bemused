Sequel.migration do
  change do
    create_table(:tags) do
      primary_key :id
      String :name
      DateTime :created_at
      DateTime :updated_at
    end

    create_table(:tags_tracks) do
      primary_key :id
      Integer :track_id
      Integer :tag_id
      DateTime :created_at
      DateTime :updated_at
    end

    create_table(:albums_tags) do
      primary_key :id
      Integer :album_id
      Integer :tag_id
      DateTime :created_at
      DateTime :updated_at
    end

    create_table(:artists_tags) do
      primary_key :id
      Integer :artist_id
      Integer :tag_id
      DateTime :created_at
      DateTime :updated_at
    end
  end
end
