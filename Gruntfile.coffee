module.exports = ->
  banner = """/* VIE.js <%= pkg.version %> - Semantic Interaction Toolkit
by Henri Bergius and the IKS Project. Available under the MIT license.
See http://viejs.org for more information
*/"""

  # Project configuration
  @initConfig
    pkg: @file.readJSON 'package.json'

    # Install dependencies
    'bower-install-simple':
      deps:
        options:
          interactive: false
          forceLatest: false
          directory: 'bower_components'

    # Build setup: concatenate source files
    concat:
      options:
        stripBanners: true
        banner: "#{banner}(function () {"
        footer: "})(this);"
      full:
        src: [
          'src/VIE.js'
          'src/Able.js'
          'src/Util.js'
          'src/Entity.js'
          'src/Collection.js'
          'src/Type.js'
          'src/Attribute.js'
          'src/Namespace.js'
          # VIE 1.x API compatibility
          'src/Classic.js'
          # Services
          'src/service/*.js'
          # Views
          'src/view/*.js'
          # jQuery AJAX transport handler for IE
          'src/xdr.js'
        ]
        dest: 'dist/vie.js'
      core:
        src: [
          'src/VIE.js'
          'src/Able.js'
          'src/Util.js'
          'src/Entity.js'
          'src/Collection.js'
          'src/Type.js'
          'src/Attribute.js'
          'src/Namespace.js'
        ]
        dest: 'dist/vie-core.js'

    # JavaScript minification
    uglify:
      options:
        banner: banner
        report: 'min'
      full:
        files:
          'dist/vie.min.js': ['dist/vie.js']
      core:
        files:
          'dist/vie-core.min.js': ['dist/vie-core.js']

    # Coding standards verification
    jshint:
      all: ['src/*.js', 'src/**/*.js']

    # Web server for the browser tests
    connect:
      server:
        options:
          port: 8000

    # Unit tests
    qunit:
      all:
        options:
          urls: ['http://localhost:8000/test/index.html']

    nodeunit:
      all: ['test/nodejs/*.js']
      options:
        reporter: 'verbose'

    # Automated recompilation and testing when developing
    watch:
      files: [
        'test/**/*.js'
        'src/*.js'
        'src/**/*.js'
      ]
      tasks: ['test']

  # Dependency installation
  @loadNpmTasks 'grunt-bower-install-simple'

  # Build dependencies
  @loadNpmTasks 'grunt-contrib-concat'
  @loadNpmTasks 'grunt-contrib-uglify'

  # Testing dependencies
  @loadNpmTasks 'grunt-contrib-connect'
  @loadNpmTasks 'grunt-contrib-jshint'
  @loadNpmTasks 'grunt-contrib-qunit'
  @loadNpmTasks 'grunt-contrib-nodeunit'
  @loadNpmTasks 'grunt-contrib-watch'

  # Local tasks
  @registerTask 'build', (target = 'full') =>
    @task.run 'bower-install-simple'
    @task.run "concat:#{target}"
    @task.run "uglify:#{target}"
  @registerTask 'test', [ 'jshint', 'build', 'connect', 'qunit', 'nodeunit']
