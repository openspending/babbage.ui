'use strict';

var path = require('path');
var gulp = require('gulp');
var babel = require('gulp-babel');
var includeFile = require('gulp-include-file');

gulp.task('default', function() {
  return gulp.src(path.join(__dirname, '/src/**/*.js'))
    .pipe(includeFile({
      regex: /require\s*\(\s*['"]([^'"]*\.html)['"]\s*\)/m
    }))
    .pipe(babel())
    .pipe(gulp.dest(path.join(__dirname, '/lib')));
});
