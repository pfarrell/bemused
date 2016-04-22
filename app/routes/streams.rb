class Bemused < Sinatra::Application
  get "/stream/:id" do
    #puts "stream_request: #{params[:id]}"
    track = Track[params[:id]]
    #puts "retrieved/sending #{track.title}"
    response.headers['Content-Type'] = 'audio/mpeg'
    send_file "#{track.media_file.absolute_path}"
  end

  get "/log/:id" do
    track = Track[params[:id]]
    track.log_event(track, track.album, track.track_artist, request.ip, 'stream', request.cookies["bmc"])
    ""
  end

end
