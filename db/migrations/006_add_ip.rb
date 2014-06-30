Sequel.migration do
  change do
    alter_table(:logs) do
      add_column :ip_address, String
    end
  end
end
