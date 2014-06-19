class Bemused < Sinatra::Application
  get "/track" do
    "hello from track"
  end

  get "/admin/track/:id" do
    haml :"admin/model", locals: {model: Track[params[:id]]}
  end

  post "/admin/track/:id" do
    track = Track[params[:id]].merge_params(params)
    track.save
    "track saved"
  end
end
