Sequel.migration do
  change do
    create_table(:media_files) do
      primary_key :id
      String :discriminator
      DateTime :imported_date
      DateTime :last_modified
      String :absolute_path
      String :name
      String :file_type
      Fixnum :track_id
      DateTime :created_at
      DateTime :updated_at
    end
  end
end
