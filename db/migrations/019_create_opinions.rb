Sequel.migration do
  change do
    create_table(:opinions) do
      primary_key :id
      Integer :user_id
      Integer :track_id
      Integer :positive
      Integer :negative
      DateTime :created_at
      DateTime :updated_at
    end

    create_table(:tokens) do
      primary_key :id
      Integer :user_id
      String :token
      DateTime :expires_at
      DateTime :created_at
      DateTime :updated_at
    end
  end
end
