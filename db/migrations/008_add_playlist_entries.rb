Sequel.migration do
  change do
    create_table(:playlists_tracks) do
      primary_key :id
      Integer :playlist_id
      Integer :track_id
      DateTime :created_at
      DateTime :updated_at
    end
  end
end
