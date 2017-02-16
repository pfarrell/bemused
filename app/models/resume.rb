class Resume < Sequel::Model

  def self.latest(user_id)
    Resume.where(user_id: user_id).order(Sequel.desc(:id))&.first
  end


  def self.log_location(user_id, url)
    Resume.create(user_id: user_id, location: url)
  end
end
