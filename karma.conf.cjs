module.exports = function(config) {
  config.set({
    // Base path, used to load files
    basePath: '',

    // Frameworks to use
    frameworks: ['jasmine'],

    // List of files/patterns to load in the browser
    files: [
      // LZ-String library (loaded first)
      'node_modules/lz-string/libs/lz-string.min.js',

      // Our browser-bundled library (make NetworkCompressionUtils available)
      'dist/browser.js',

      // Test setup (must be loaded after library but before test files)
      'src/tests/jasmine/test-setup.js',

      // Test files
      'src/tests/jasmine/*.spec.js'
    ],

    // List of files to exclude
    exclude: [
      'src/tests/**/*.test.js', // Exclude Jest test files
      'src/tests/**/jest/**'
    ],

    // Test results reporter to use
    reporters: ['progress'],

    // Coverage configuration
    coverageReporter: {
      dir: 'coverage/',
      reporters: [
        { type: 'lcov', subdir: '.' },
        { type: 'text-summary' },
        { type: 'html', subdir: 'html' }
      ],
      includeAllSources: true
    },

    // Preprocess matching files before serving them to the browser
    preprocessors: {
      'dist/browser.js': ['coverage']
    },

    // Web server port
    port: 9876,

    // Enable/disable colors in the output
    colors: true,

    // Level of logging
    logLevel: config.LOG_INFO,

    // Enable/disable watching file and executing tests
    autoWatch: false,

    // Start these browsers
    browsers: ['ChromeHeadless'],

    // Browser timeout
    browserNoActivityTimeout: 30000,

    // Continuous Integration mode
    singleRun: true,

    // Concurrency level
    concurrency: Infinity,

    // Mock browser APIs for testing
    client: {
      jasmine: {
        timeoutInterval: 10000
      }
    }
  });
};