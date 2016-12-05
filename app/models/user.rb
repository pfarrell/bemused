class User
  attr_accessor :id, :token, :profile_url, :logout_url, :name

  def initialize(token)
    return {} if token.nil?
    hsh = JSON.parse(Base64.decode64(token), symbolize_names: true) unless token.nil?
    @id    = hsh[:user_id]
    @token = hsh[:token]
    @profile_url = hsh[:profile_url]
    @logout_url = hsh[:logout_url]
    @name = hsh[:name]
  end

end
