Sequel.migration do
  change do
    alter_table(:playlist_tracks) do
      add_column :order, Integer
    end
  end
end
