Sequel.migration do
  change do
    create_table(:resumes) do
      primary_key :id
      String :user_id
      String :location
      DateTime :created_at
      DateTime :updated_at
    end

    alter_table(:resumes) do
      add_index [:created_at, :user_id]
    end
  end
end
