class MockGmail
  def self.send_login(email, token, &block)
    yield
  end

  def self.connect(user, pass)
    yield MockConnection.new
  end

end

class MockConnection
  def deliver(&block)
    $stderr.puts "mock gmail acted like it sent an email"
    if block_given?
      mail = Mail.new(&block)
    end
    true
  end


end
