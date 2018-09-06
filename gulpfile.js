'use strict'

const del = require('del')
const gulp = require('gulp')
const babel = require('gulp-babel')
const rename = require('gulp-rename')

function compile() {
  return gulp
    .src(['./szn-elements.js', './szn-elements-mutation-observer.js', './szn-elements-noop.js'])
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
  copyNoopRuntime,
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
    .pipe(babel()) // strips trailing commas in function calls (ES2017) so the source becomes ES2015-compatible
    .pipe(rename('szn-elements.es6.js'))
    .pipe(gulp.dest('./dist'))
}

function copyCustomElementsRuntime() {
  return gulp
    .src('./szn-elements-custom-elements.js')
    .pipe(babel()) // strips trailing commas in function calls (ES2017) so the source becomes ES2015-compatible
    .pipe(gulp.dest('./dist'))
}

function copyMutationObserverRuntime() {
  return gulp
    .src('./szn-elements-mutation-observer.js')
    .pipe(babel()) // strips trailing commas in function calls (ES2017) so the source becomes ES2015-compatible
    .pipe(rename('szn-elements-mutation-observer.es6.js'))
    .pipe(gulp.dest('./dist'))
}

function copyNoopRuntime() {
  return gulp
    .src('./szn-elements-noop.js')
    .pipe(babel()) // strips trailing commas in function calls (ES2017) so the source becomes ES2015-compatible
    .pipe(rename('szn-elements-noop.es6.js'))
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

function clean() {
  return del('./dist')
}

exports.default = gulp.series(
  clean,
  gulp.parallel(
    compile,
    copy,
  ),
  minify,
)
