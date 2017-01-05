module Favoritable
  def favorited?(user)
    FavoriteTrack.where(user_id: user.id, target_id: self.id).count > 0
  end
end
