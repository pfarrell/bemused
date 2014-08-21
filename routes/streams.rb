class Bemused < Sinatra::Application
  get "/stream/:id" do
    track = Track[params[:id]]
#    track.log_event(track, track.album, track.album.artist, request.ip, 'stream', request.cookies["bmc"])
    response.headers['Content-Type'] = 'audio/mpeg'
    send_file "#{track.media_file.absolute_path}"
  end

  get "/log/:id" do
    track = Track[params[:id]]
    track.log_event(track, track.album, track.album.artist, request.ip, 'stream', request.cookies["bmc"])
  end
    
end
