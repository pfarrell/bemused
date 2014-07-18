Sequel.migration do
  change do
    alter_table(:playlists) do
      add_column :image_path, String
    end
  end
end
