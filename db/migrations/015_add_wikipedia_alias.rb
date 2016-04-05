Sequel.migration do
  change do
    alter_table(:albums) do
      add_column :wikipedia, String
    end

    alter_table(:artists) do
      add_column :wikipedia, String
    end
  end
end
