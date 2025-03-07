require 'fileutils'
require 'json'

class Bemused < Sinatra::Application
  get "/upload" do
    haml :upload, layout: !request.xhr?
  end

  post '/upload' do
    content_type :text
    redis = Redis.new
    key=params[:key] || "bemused:incoming"

    params['images'].map do |f|
      FileUtils.mv(f[:tempfile], "public/tmp/uploads/#{f[:filename]}")
      hsh={}
      hsh["artist_name"] = params["artist_name"]
      hsh["album_name"] = params["album_name"]
      hsh["file_name"] = File.absolute_path("public/tmp/uploads/#{f[:filename]}")
      hsh["genre"] = params["genre"] unless params["genre"].nil?
      redis.rpush(key, hsh.to_json )
    end

    redirect("#{url_for "/upload"}")
  end
end
