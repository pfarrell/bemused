class Bemused < Sinatra::Application
  get '/admin/tags' do
    redirect url_for("/admin/tags/1")
  end

  get '/admin/tags/:page' do
    page = params[:page].to_i
    tags = Tag.order(Sequel.asc(:id)).paginate(page, 24)
    respond_to do |wants|
      wants.json { tags.to_json }
      wants.html { haml :'admin/tags', locals: { model: tags } }
    end
  end

  get '/tags' do
    haml :tags, locals: { tags: Tag.all, set: @tags }
  end

  post '/tags/set' do
    tags = params.select{|t| t =~ /^tag/}.map{|t| t[1]}
    response.set_cookie(:tags, path: url_for("/"), value: tags, expires: Time.now + 3600 * 24 * 365 * 10)
    redirect url_for("/tags")
  end

  post '/tags' do
    t = Tag.new.merge_params(params).save
    redirect url_for('/tags')
  end

  post '/admin/tag/:id' do
    Tag[params[:id]].merge_params(params).save
  end
end
