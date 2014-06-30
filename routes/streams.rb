class Bemused < Sinatra::Application
  get "/stream/:id" do
    track = Track[params[:id]]
    track.log_event(track, track.album, track.artist, request.ip, 'stream')
    send_file "#{track.media_file.absolute_path}"
  end
end
