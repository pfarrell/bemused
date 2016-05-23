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
  end
end
