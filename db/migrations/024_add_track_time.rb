Sequel.migration do
  change do
    alter_table(:tracks) do
      add_column :duration_sec, Integer
    end
  end
end
