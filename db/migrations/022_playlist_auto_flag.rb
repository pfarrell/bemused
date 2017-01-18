Sequel.migration do
  change do
    alter_table(:playlists) do
      add_column :auto_generated, TrueClass
    end
  end
end
