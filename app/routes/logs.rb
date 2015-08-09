class Bemused < Sinatra::Application
  def page_seq(curr_page, page_count)
    start = curr_page > 5 ? curr_page - 5 : 1
    stop = page_count - curr_page > 5 ? curr_page + 5 : page_count
    return (start..stop)
  end

  get "/logs" do 
    redirect url_for("/logs/1")
  end

  get "/logs/:page" do
     page = params[:page].to_i
     haml :logs, locals: {model: {data: Log.order(Sequel.desc(:id)).paginate(page, 25)}}
  end
end
