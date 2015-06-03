module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-html2js');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/**/*.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    html2js: {
      dist: {
        options: {
          base: '.',
          module: 'ngCubes.templates'
        },
        src: ['templates/**/*.html'],
        dest: 'src/tmp/templates.js'
      }
    },
    less: {
      development: {
        options: {
          paths: ["less"],
          strictImports: true
        },
        files: {
          "build/angular-cubes.css": ["less/build.less"]
        }
      }
    },
    watch: {
      templates: {
        files: ['templates/**/*.html'],
        tasks: ['html2js']  
      },
      js: {
        files: ['src/**/*.js'],
        tasks: ['uglify']  
      },
      style: {
        files: ['less/**/*.less'],
        tasks: ['less']  
      },
    }
  });

  grunt.registerTask('default', ['less', 'html2js', 'uglify']);
};
