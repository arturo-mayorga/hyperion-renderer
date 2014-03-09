module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
          options: {
            banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
          },
          build: {
            src: 'temp/<%= pkg.name %>.js',
            dest: 'build/<%= pkg.name %>.min.js'
          }
        },
        concat: {
            app: {
                src:'src/*.js',
                dest:'temp/main.js'
            }
        },
        'closure-compiler': {
            frontend: {
                js: [
                    'src/glmatrix.js',
                    'src/gcamera.js',
                    'src/gmaterial.js',
                    'src/gobject.js',
                    'src/gtexture.js',
                    'src/gscene.js',
                    'src/gcontext.js',
                    'src/gmtlloader.js',
                    'src/gobjloader.js',
                    'src/gcameracontroller.js',
                    'src/main.js'
                ],
                jsOutputFile: 'build/main.min.js',
                options: {
                    compilation_level: 'ADVANCED_OPTIMIZATIONS',
                    language_in: 'ECMASCRIPT5_STRICT'/*,
                    define: [
                        '"DEBUG=false"',
                        '"UI_DELAY=500"'
                    ],*/
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-closure-compiler');
    
    // Default task(s).
    grunt.registerTask('default', ['closure-compiler', 'concat']);

};