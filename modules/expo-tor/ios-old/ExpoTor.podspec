Pod::Spec.new do |s|
  s.name           = 'ExpoTor'
  s.version        = '1.0.0'
  s.summary        = 'Expo module for Tor network integration on iOS and Android'
  s.description    = <<-DESC
    ExpoTor provides complete Tor network functionality for React Native Expo apps.
    Supports anonymous networking, SOCKS proxy, and HTTP requests through Tor.
  DESC
  s.author         = 'Your Name'
  s.homepage       = 'https://github.com/yourusername/expo-tor'
  s.platforms      = {
    :ios => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  # Core Expo dependency
  s.dependency 'ExpoModulesCore'

  # Tor.framework from iCepa
  # Option 1: Using CocoaPods (if published)
  s.dependency 'Tor', '~> 408.12'

  # Option 2: Using local XCFramework or vendored framework
  # Recommended: Download Tor.framework from https://github.com/iCepa/Tor.framework/releases
  # and place it in ios/Frameworks/ directory
  #s.vendored_frameworks = 'Frameworks/Tor.framework'

  # Alternative Option 3: Using direct framework path
  # Uncomment the following if you're using a manually built framework
  # s.preserve_paths = 'Frameworks/**/*'
  # s.xcconfig = {
  #   'FRAMEWORK_SEARCH_PATHS' => '$(PODS_ROOT)/../../../modules/expo-tor/ios/Frameworks',
  #   'OTHER_LDFLAGS' => '-framework Tor'
  # }

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    # Enable if using C++ in the future
    # 'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17'
  }

  # Required for Tor.framework dependencies
  s.libraries = 'c++'

  # Include all Swift and header files
  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"

  # Exclude example/test files if any
  s.exclude_files = "**/*.{podspec}"

  # Minimum iOS deployment target for Tor.framework
  s.ios.deployment_target = '15.1'

  # Required frameworks for Tor
  s.frameworks = 'Foundation', 'Security', 'SystemConfiguration', 'NetworkExtension'
end
