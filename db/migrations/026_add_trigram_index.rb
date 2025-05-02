Sequel.migration do
  up do
    # Enable the unaccent extension
    run "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

    # Add indexes to your tables
    # Replace table_name and column_name with your actual tables and columns
    # You can repeat this for each column you want to index
    run "DROP INDEX IF EXISTS idx_unaccent_album_title;"
    run "DROP INDEX IF EXISTS idx_unaccent_artist_name;"
    run "DROP INDEX IF EXISTS idx_unaccent_track_title;"
    run "CREATE INDEX idx_trgm_unaccent_album_title ON albums (f_unaccent(lower(title)));"
    run "CREATE INDEX idx_trgm_unaccent_artist_name ON artists (f_unaccent(lower(name)));"
    run "CREATE INDEX idx_trgm_unaccent_track_title ON tracks (f_unaccent(lower(title)));"
  end

  down do
    # Drop the indexes
    run "DROP INDEX IF EXISTS idx_trgm_unaccent_album_title;"
    run "DROP INDEX IF EXISTS idx_trgm_unaccent_artist_name;"
    run "DROP INDEX IF EXISTS idx_trgm_unaccent_track_title;"

    # Drop the extension (optional - might affect other parts of your app)
    run "DROP EXTENSION IF EXISTS pg_tgrm;"
  end
end
