'use strict'

const gulp = require('gulp')
const babel = require('gulp-babel')
const rename = require('gulp-rename')

function compile() {
  return gulp
    .src(['./szn-elements.js', './szn-elements-mutation-observer.js'])
    .pipe(babel({
      presets: [['env', {
        targets: {
          browsers: ['ie 8'],
        },
      }]],
    }))
    .pipe(rename({
      suffix: '.es3',
    }))
    .pipe(gulp.dest('./dist'))
}

const copy = gulp.parallel(
  copyRuntime,
  copyCustomElementsRuntime,
  copyMutationObserverRuntime,
  copyPackageMetaFiles,
)

function copyPackageMetaFiles() {
  return gulp
    .src(['./LICENSE', './package.json', './README.md'])
    .pipe(gulp.dest('./dist'))
}

function copyRuntime() {
  return gulp
    .src('./szn-elements.js')
    .pipe(rename('szn-elements.es6.js'))
    .pipe(gulp.dest('./dist'))
}

function copyCustomElementsRuntime() {
  return gulp
    .src('./szn-elements-custom-elements.js')
    .pipe(gulp.dest('./dist'))
}

function copyMutationObserverRuntime() {
  return gulp
    .src('./szn-elements-mutation-observer.js')
    .pipe(rename('szn-elements-mutation-observer.es6.js'))
    .pipe(gulp.dest('./dist'))
}

function minify() {
  return gulp
    .src('./dist/*.js')
    .pipe(babel({
      presets: ['minify'],
    }))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(gulp.dest('./dist'))
}

exports.default = gulp.series(
  gulp.parallel(
    compile,
    copy,
  ),
  minify,
)
