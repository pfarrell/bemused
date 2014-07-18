Sequel.migration do
  change do
    alter_table(:playlists_tracks) do
      add_column :order, Integer
    end
  end
end
