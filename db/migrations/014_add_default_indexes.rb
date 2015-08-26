Sequel.migration do
  change do
    alter_table(:albums) do
      add_index :artist_id
      add_index :title
    end

    alter_table(:artists) do
      add_index :name
    end
    
    alter_table(:media_files) do
      add_index :track_id
      add_index :absolute_path
    end

    alter_table(:playlist_tracks) do
      add_index :playlist_id
      add_index :track_id
    end

    alter_table(:tracks) do
      add_index :album_id
      add_index :artist_id
      add_index :media_file_id
      add_index :title
    end
  end
end
