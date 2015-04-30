require 'fileutils'
require 'json'

class Bemused < Sinatra::Application
  get "/upload" do
    haml :upload
  end

  post '/upload' do
    require 'byebug'
    byebug
    content_type :text
    redis = Redis.new

    params['images'].map do |f| 
      FileUtils.mv(f[:tempfile], "public/tmp/uploads/#{f[:filename]}")
      hsh={}
      hsh["artist_name"] = params["artist_name"]
      hsh["album_name"] = params["album_name"]
      hsh["file_name"] = File.absolute_path("public/tmp/uploads/#{f[:filename]}")
      redis.rpush("bemused:incoming", hsh.to_json )
    end

    redirect("#{url_for "/upload"}")
  end
end
