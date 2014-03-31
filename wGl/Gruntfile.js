module.exports = function(grunt) {
    
    var srcList = [
                    'src/graphics/renderstrategy/*.js',
                    'src/graphics/core/*.js',
                    'src/graphics/assets/*.js',
                    'src/graphics/assetloader/*.js',
                    'src/graphics/scene/*.js',
                    'src/graphics/hud/*.js',
                    'src/graphics/*.js',
                    'src/fsm.js',
                    'src/lessonfsm.js',
                    'src/gcameracontroller.js',
                    'src/main.js'
                ];

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
          options: {
            banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
          },
          build: {
            src: srcList,
            dest: 'build/main.ug.min.js'
          }
        },
        concat: {
            app: {
                src:srcList,
                dest:'build/main.concat.js'
            }
        },
        'closure-compiler': {
            frontend: {
                js: srcList,
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
    grunt.registerTask('default', ['closure-compiler', 'concat', 'uglify']);

};