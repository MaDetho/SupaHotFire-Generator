var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var nodemon = require('gulp-nodemon');

gulp.task('serve', ['sass'], function () {

    browserSync.init({
        ghostMode: false,
        notify: false,
        proxy: "http://localhost:8085"
    });

    gulp.watch('public/scss/*.scss', ['sass']);
    gulp.watch('public/js/*.js').on('change', browserSync.reload);
    gulp.watch('public/*.html').on('change', browserSync.reload);
});

gulp.task('sass', function () {
    return gulp.src('public/scss/style.scss')
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(autoprefixer({ browsers: ['last 2 versions'] }))
        .pipe(gulp.dest('public/css'))
        .pipe(browserSync.stream());
});

gulp.task('start', function () {
    nodemon({
        exec: 'node --debug',
        script: 'start.js',
        ext: 'js',
        ignore: ['public/'],
        env: { 'NODE_ENV': 'development' }
    })
})

gulp.task('default', ['start', 'serve']);