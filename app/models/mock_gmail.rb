class MockGmail
  def self.send_login(email, token)

  end

  def self.connect(user, pass)
    yield MockConnection.new
  end
end

class MockConnection
  def deliver
    $stderr.puts "mock gmail acted like it sent an email"
    true
  end
end
