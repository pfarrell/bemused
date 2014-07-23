Sequel.migration do
  change do
    alter_table(:logs) do
      add_column :cookie, String 
    end
  end
end
