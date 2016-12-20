require './app'

def log_error(file)
  puts file.to_json
end

MediaFile.each do |file|
  log_error(file) unless File.exist?(file.absolute_path)
end
