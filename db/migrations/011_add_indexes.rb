Sequel.migration do
  change do
    alter_table(:playlists_tracks) do
      index [:playlist_id, :track_id]
    end
  end
end
