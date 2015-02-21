root = ::File.dirname(__FILE__)
require ::File.join( root, 'app' )

ENV['TMPDIR'] = "public/tmp"

use Rack::Deflater
run Bemused.new
