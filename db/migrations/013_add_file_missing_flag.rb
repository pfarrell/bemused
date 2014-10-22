Sequel.migration do
  change do
    alter_table(:media_files) do
      add_column :file_missing, TrueClass
    end
  end
end
