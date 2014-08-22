class Bemused < Sinatra::Application
  get "/logs" do 
    redirect url_for("/logs/1")
  end

  get "/logs/:page" do
     page = params[:page].to_i
     haml :logs, locals: {logs: Log.order(Sequel.desc(:id)).paginate(page, 25), nxt: page + 1, prev: page - 1}
  end
end
