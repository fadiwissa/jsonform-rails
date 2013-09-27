# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'jsonform/rails/version'

Gem::Specification.new do |spec|
  spec.name          = "jsonform-rails"
  spec.version       = Jsonform::Rails::VERSION
  spec.authors       = ["Nathaniel Fitzgerald-Hood"]
  spec.email         = ["nathaniel@widgetworks.com.au"]
  spec.description   = %q{Asset wrapper gem for joshfire's jsonform: Build forms from JSON Schema. Easily template-able. Compatible with Twitter Bootstrap out of the box.}
  spec.summary       = %q{Build forms from JSON Schema using Javascript}
  spec.homepage      = "https://github.com/mrthan/jsonform-rails"
  spec.license       = "MIT"

  spec.files         = `git ls-files`.split($/)
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = ["lib"]

  spec.add_development_dependency "bundler", "~> 1.3"
  spec.add_development_dependency "rake"
end
