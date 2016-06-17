Sequel.migration do
  change do
    alter_table(:tracks) do
      add_column :wikipedia, String
    end
  end
end
