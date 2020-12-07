class Bemused < Sinatra::Application

  get "/admin/users" do
    haml :"admin/users", locals: {users: User.all}
  end

  post "/admin/users/new" do
    user = User.new(username: params["username"])
  end
end
