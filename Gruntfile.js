module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-html2js');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    connect: {
      server: {
        port: 3000,
        base: '.'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: ['src/util.js', 'src/cubes.js', 'src/pager.js', 'src/crosstab.js', 'src/facts.js',
              'src/treemap.js', 'src/panel.js', 'src/workspace.js', 'src/cubes.js',
              'src/tmp/templates.js'],
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    concat: {
      options: {
        stripBanners: true,
        separator: ';'
      },
      dist: {
        src: ['src/util.js', 'src/cubes.js', 'src/pager.js', 'src/crosstab.js', 'src/facts.js',
              'src/treemap.js', 'src/panel.js', 'src/workspace.js', 'src/cubes.js',
              'src/tmp/templates.js'],
        dest: 'build/<%= pkg.name %>.js'
      },
    },
    html2js: {
      dist: {
        options: {
          base: '.',
          module: 'ngCubes.templates',
          rename: function(name) {
            return name.replace('templates', 'angular-cubes-templates');
          }
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
        tasks: ['concat', 'uglify']  
      },
      style: {
        files: ['less/**/*.less'],
        tasks: ['less']  
      },
    }
  });

  grunt.registerTask('default', ['less', 'html2js', 'concat', 'uglify']);
  grunt.registerTask('server', ['connect', 'watch'])
};
