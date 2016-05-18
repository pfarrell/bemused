Sequel.migration do
  change do
    alter_table(:logs) do
      add_index [:created_at]
    end
  end
end
