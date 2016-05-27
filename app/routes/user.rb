
class Bemused < Sinatra::Application
  def get_token_url(req, token)
    "#{req.scheme}://#{req.host_with_port}#{url_for('/user/login')}/#{token}"
  end

  get "/user/new" do
    haml :new_user
  end

  get "/user/login" do
    haml :login
  end

  post "/user/login" do
    #email authentication
    user = User.find(email: params[:email])
    if(user.nil?)
      raise "User not found #{params[:email]}"
    else
      token = Token.create(token: SecureRandom.hex)
      user.add_token(token)
      user.save
      settings.email.send_login(user.email, get_token_url(request, token.token))
    end
  end

  get "/user/login/:token" do
    t = Token.where(token: params[:token])
    if(t.count > 0)
      response.set_cookie(:bmc, value: params[:token], path: "/", expires: Time.now + 3600 * 24 * 365 * 10)
      haml :index, locals: {artists: random_artists(66)}
    else
      raise "Token not found #{token.token}"
    end
  end

  post "/user" do
    user = User.find_or_create(email: params[:email])
    user.username = params[:username]
    user.save
    token = Token.create(token: SecureRandom.hex)
    user.add_token(token)
    user.save
    settings.email.send_login(user.email, get_token_url(request, token.token))
    user.to_json
  end
end
