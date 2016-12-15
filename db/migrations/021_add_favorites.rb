Sequel.migration do
  change do
    create_table(:favorites) do
      primary_key :id
      Integer :target_id
      String :user_id
      String :kind
      DateTime :created_at, index: true
      DateTime :updated_at
    end

    alter_table(:favorites) do
      add_index [:user_id, :kind]
    end
  end
end
