module Bemused
  module Helpers

    def require_logged_in 
      redirect('/sessions/new') unless is_authenticated?
    end

    def is_authenticated?
      return !!session[:user_id]
    end

    def partial(template, *args)
      options = args.last.is_a?(Hash) ? args.pop : { }
      options.merge!(:layout => false)
      if collection = options.delete(:collection) then
        haml_concat(collection.inject([]) do |buffer, member|
        buffer << haml(template, options.merge(
          :layout => false,
          :locals => {template.to_sym => member}
          )
        )
        end.join("\n"))
      else
        haml_concat(haml(template, options))
      end
    end
  end
end
