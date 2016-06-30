class Messaging
  attr_accessor :klass

  def initialize(klass)
    @klass = klass
  end

  def send_login(email, token_link)
    connect do |gmail|
      gmail.deliver do
        to email
        subject "Bemused:: Login Granted"
        text_part do
          body = "#{token_link}"
        end
        html_part do
          content_type 'text/html; charset=UTF-8'
          body %Q[<a href="#{token_link}">Want to get some great music?</a>?]
        end
      end
    end
  end

  def connect(&block)
    gmail_user = ENV["GMAIL_USER"]
    gmail_pass = ENV["GMAIL_PASS"]
    @klass.connect(gmail_user, gmail_pass) do |gmail|
      yield gmail
    end
  end
end
