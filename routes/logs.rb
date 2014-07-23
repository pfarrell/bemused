class Bemused < Sinatra::Application
  get "/logs" do
    "hello from track"
    haml :logs, locals: {logs: Log.all}
  end
end
