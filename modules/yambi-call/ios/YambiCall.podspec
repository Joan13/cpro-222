Pod::Spec.new do |s|
  s.name           = 'YambiCall'
  s.version        = '1.0.0'
  s.summary        = 'Native CallKit and PushKit integration for Yambi'
  s.description    = 'Handles incoming VoIP pushes, CallKit UI, and native call transitions for Yambi'
  s.author         = 'Yambi Team'
  s.homepage       = 'https://app.yambi.net'
  s.platforms      = {
    :ios => '16.0'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'GoogleWebRTC', '~> 1.1'
  s.dependency 'Socket.IO-Client-Swift', '~> 16.1'
  s.dependency 'GRDB.swift', '~> 6.0'

  s.frameworks = 'CallKit', 'PushKit', 'AVFoundation', 'ReplayKit'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
