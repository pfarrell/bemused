require 'fileutils'

class Bemused < Sinatra::Application
  get "/upload" do
    haml :upload
  end

  post '/upload' do
    content_type :text
    redis = Redis.new

    params['images'].map do |f| 
      FileUtils.mv(f[:tempfile], "public/tmp/uploads/#{f[:filename]}")
      redis.rpush("bemused:incoming", File.absolute_path("public/tmp/uploads/#{f[:filename]}") )
    end

    redirect("#{url_for "/upload"}")
  end
end
