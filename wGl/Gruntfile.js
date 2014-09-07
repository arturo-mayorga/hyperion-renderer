module.exports = function(grunt) {
    
    var srcList = [
                    'src/graphics/renderstrategy/interfaces/*.js',
                    'src/graphics/renderstrategy/strategies/*.js',
                    'src/graphics/renderstrategy/*.js',
                    'src/graphics/core/*.js',
                    'src/graphics/assets/*.js',
					'src/graphics/assetloader/proxy/*.js',
					'src/graphics/assetloader/mtl/reader/*.js',
					'src/graphics/assetloader/mtl/*.js',
					'src/graphics/assetloader/obj/reader/*.js',
					'src/graphics/assetloader/obj/*.js',
					'src/graphics/assetloader/threejs/reader/*.js',
					'src/graphics/assetloader/threejs/*.js',
                    'src/graphics/assetloader/*.js',
                    'src/graphics/scene/interfaces/*.js',
                    'src/graphics/scene/drawordering/*.js',
					'src/graphics/scene/concrete/*.js',
					'src/graphics/scene/primitives/*.js',
					'src/graphics/scene/animations/armature/*.js',
					'src/graphics/scene/animations/*.js',
					'src/graphics/scene/decorators/interfaces/*.js',
					'src/graphics/scene/decorators/*.js',
                    'src/graphics/scene/*.js',
                    'src/graphics/input/*.js',
                    'src/graphics/hud/*.js',
                    'src/graphics/*.js',
                    'src/fsm/*.js',
                    'src/app/*.js',
                    'src/*.js'
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
                    language_in: 'ECMASCRIPT5_STRICT'
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