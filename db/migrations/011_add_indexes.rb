Sequel.migration do
  change do
    alter_table(:playlists_tracks) do
      add_index [:playlist_id, :track_id]
    end
  end
end
