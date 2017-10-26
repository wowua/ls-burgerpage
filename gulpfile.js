'use strict';
const fs = require('fs');

// plugins
const gulp = require('gulp')
  , pug = require('gulp-pug')
  , sass = require('gulp-sass')
  , sassGlob = require('gulp-sass-glob')
  , browserSync = require('browser-sync').create()
  , reload = browserSync.reload
  , uglify = require('gulp-uglify')
  , rename = require("gulp-rename")
  , browserify = require('gulp-browserify')
  , plumber = require('gulp-plumber')
  , useref = require('gulp-useref')
  , gulpif = require('gulp-if')
  , cssnano = require('gulp-cssnano')
  , autoprefixer = require('gulp-autoprefixer')
  , sourcemaps = require('gulp-sourcemaps')
  , imagemin = require('gulp-imagemin')
  , imageminSvgo = require('imagemin-svgo')
  , pngquant = require('imagemin-pngquant')
  , urlAdjuster = require('gulp-css-url-adjuster')
  , cssunit = require('gulp-css-unit')
  , svgSprite = require('gulp-svg-sprite')
  , rsp = require('remove-svg-properties')
  , gcmq = require('gulp-group-css-media-queries')
  , webpack = require('webpack')
  , webpackStream = require('webpack-stream');

// paths
const SRC_PATH = 'app';
const DIST_PATH = 'dist';

var paths = {
  pug: {
    src: SRC_PATH + '/templates/**/*.pug',
    pages: SRC_PATH + '/templates/pages/*.pug',
    dist: DIST_PATH + '/'
  },

  scss: {
    src: SRC_PATH + '/css/**/*.scss',
    entry: SRC_PATH + '/css/main.scss',
    dist: DIST_PATH + '/css'
  },

  js: {
    src: SRC_PATH + '/js/**/*.js',
    entry: SRC_PATH + '/js/main.js',
    dist: DIST_PATH + '/js'
  },

  img: {
    src: SRC_PATH + '/img/**/*.*',
    dist: DIST_PATH + '/img'
  },

  fonts: {
    src: SRC_PATH + '/fonts/**/*.*',
    dist: DIST_PATH + '/fonts'
  },

  browserSync: {
    baseDir: './' + DIST_PATH,
    watchPaths: [SRC_PATH + '/templates/pages/*.pug', DIST_PATH + 'css/*.css', DIST_PATH + 'js/*.js']
  }
};

// pug
gulp.task('pug', function () {
  return gulp.src(paths.pug.pages)
    .pipe(plumber())
    .pipe(pug({
      pretty: true,
      locals: JSON.parse(fs.readFileSync('./content.json', 'utf8')),
      basedir: './'
    }))
    .pipe(useref())
    .pipe(sourcemaps.init())
    .pipe(gulpif('*.js', uglify()))
    .pipe(gulpif('*.css', cssnano()))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.pug.dist))
    .pipe(reload({ stream: true }));
});

// sass
gulp.task('sass', function () {
  return gulp.src(paths.scss.entry)
    .pipe(plumber())
    .pipe(sassGlob())
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['> 5%'],
      cascade: false
    }))
    .pipe(urlAdjuster({
      replace: ['../../', '../']
    }))
    .pipe(cssunit({
      type: 'px-to-rem',
      width: 16
    }))
    .pipe(gcmq())
    .pipe(cssnano())
    .pipe(sourcemaps.write())
    .pipe(rename('main.min.css'))
    .pipe(gulp.dest(paths.scss.dist))
    .pipe(reload({ stream: true }));
});

// server
gulp.task('sync', function () {
  browserSync.init({
    open: false,
    server: {
      baseDir: paths.browserSync.baseDir
    }
  });
});

// scripts
gulp.task('scripts', function () {
  return gulp.src(paths.js.entry)
    .pipe(plumber())
    .pipe(webpackStream(require('./webpack.config.js'), webpack))
    .on('error', function handleError() {
      this.emit('end'); // Recover from errors
    })
    .pipe(uglify())
    .pipe(gulp.dest(paths.js.dist))
    .pipe(reload({ stream: true }));
});

// images
gulp.task('images', function () {
  return gulp.src(paths.img.src)
    .pipe(imagemin([
      imagemin.svgo({
        plugins: [
          { removeUselessDefs: false },
          // { cleanupIDs: false}
          { cleanupIDs: true }
        ]
      }),
      imagemin.gifsicle(),
      imagemin.jpegtran(),
      imagemin.optipng()
    ]))
    .pipe(gulp.dest(paths.img.dist))
    .pipe(reload({ stream: true }));
});

gulp.task('sprite:svg', function () {
  var config = {
    shape: {
      spacing: {
        padding: 5
      }
    },
    mode: {
      symbol: {
        dest: './dist/img/sprite',
        sprite: 'sprite.svg'
      }
    }
  };

  rsp.remove({
    src: './dist/img/sprite/sprite.svg',
    out: './dist/img/sprite/',
    stylesheets: false,
    properties: ['fill']
  });

  return gulp.src('./app/img/icons/*.svg')
    .pipe(svgSprite(config))
    .pipe(gulp.dest('.'));
});

// fonts
gulp.task('fonts', function () {
  return gulp.src(paths.fonts.src)
    .pipe(gulp.dest(paths.fonts.dist))
});

// watch
gulp.task('watch', function () {
  gulp.watch(paths.pug.src, gulp.series('pug'))
  gulp.watch(paths.scss.src, gulp.series('sass'))
  gulp.watch(paths.js.src, gulp.series('scripts', 'pug'))
  gulp.watch(paths.img.src, gulp.series('images'))
});


/* --------- default --------- */
gulp.task('default', gulp.series(
  gulp.parallel('pug', 'sass', 'scripts', 'images', 'sprite:svg', 'fonts'),
  gulp.parallel('sync', 'watch')
));