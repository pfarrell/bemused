module Editable

  def editable_attributes
    self.values.select {|k,v| ![:id,:created_at,:updated_at].include? k}
  end

  def merge_params(params)
    symd = Hash[params.map {|k,v| [k.to_sym, v]}.select{|k,v| ![:id, :splat, :captures].include? k}]
    self.values.merge!(symd)
    self
  end
end
