class Bemused < Sinatra::Application
  get "/logs" do
    "hello from track"
 #   haml :logs, locals: {logs: Log.all}
     haml :logs, locals: {logs: Log.order(Sequel.desc(:id)).all}
  end
end
