Sequel.migration do
  change do
    create_table(:artists) do
      primary_key :id
      String :name
      String :image_path
      DateTime :created_at
      DateTime :updated_at
    end
  end
end
