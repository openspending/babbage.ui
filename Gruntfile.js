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
      app: {
        options: {
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        build: {
          src: ['dist/<%= pkg.name %>.js'],
          dest: 'dist/<%= pkg.name %>.min.js'
        }
      },
      deps: {
        options: {},
        build: {
          src: [
            'bower_components/d3/d3.js',
            'bower_components/d3-plugins/sankey/sankey.js',
            'bower_components/vega-lite/lib/vega.js',
            'bower_components/vega-lite/vega-lite.js',
            'bower_components/angular/angular.js',
            'bower_components/angular-route/angular-route.js',
            'bower_components/angular-bootstrap/ui-bootstrap.min.js',
            'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
            'bower_components/angular-ui-select/dist/select.min.js',
            'bower_components/angular-filter/dist/angular-filter.js'
          ],
          dest: 'dist/deps.js'
        }
      }
    },
    concat: {
      options: {
        stripBanners: true,
        separator: ';'
      },
      dist: {
        src: ['src/app.js', 'src/**/*.js'],
        dest: 'dist/<%= pkg.name %>.js'
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
        dest: 'dist/templates.js'
      }
    },
    less: {
      app: {
        options: {
          paths: ["less"],
          strictImports: true
        },
        files: {
          "dist/angular-cubes.css": ["less/build.less"]
        }
      },
      embed: {
        options: {
          paths: ["less"],
          strictImports: true
        },
        files: {
          "dist/embed.css": ["less/embed.less"]
        }
      },
      deps: {
        files: {
          "dist/deps.css": ["node_modules/bootstrap/dist/css/bootstrap.css",
                            "bower_components/angular/angular-csp.css",
                            "bower_components/angular-ui-select/dist/select.min.css"]
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
        tasks: ['concat', 'uglify:app']
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
