class Bemused < Sinatra::Application
  get "/stream/:id" do
    track = Track[params[:id]]
    send_file "#{track.media_file.absolute_path}"
  end
end
