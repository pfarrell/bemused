module Editable

  def editable_attributes
    self.values.select {|k,v| ![:id,:created_at,:updated_at].include? k}
  end

end
