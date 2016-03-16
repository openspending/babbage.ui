'use strict';

var path = require('path');
var gulp = require('gulp');
var babel = require('gulp-babel');
var includeFile = require('gulp-include-file');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var less = require('gulp-less');
var minifyCss = require('gulp-minify-css');
var prefixer = require('gulp-autoprefixer');

var cssDir = path.join(__dirname, '/less');
var libDir = path.join(__dirname, '/lib');
var distDir = path.join(__dirname, '/dist');

function processStyles(dir) {
  var files = [
    path.join(cssDir, '/build.less'),
  ];
  return gulp.src(files)
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(prefixer({browsers: ['last 4 versions']}))
    .pipe(minifyCss({compatibility: 'ie8'}))
    .pipe(concat('lib.css'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(dir));
}

gulp.task('default', [
  'lib.scripts',
  'lib.styles',
  'dist.styles'
]);

gulp.task('lib.scripts', function() {
  return gulp.src(path.join(__dirname, '/src/**/*.js'))
    .pipe(includeFile({
      regex: /require\s*\(\s*['"]([^'"]*\.html)['"]\s*\)/m
    }))
    .pipe(babel())
    .pipe(gulp.dest(libDir));
});

gulp.task('lib.styles', function() {
  return processStyles(libDir);
});

gulp.task('dist.styles', function() {
  return processStyles(distDir);
});