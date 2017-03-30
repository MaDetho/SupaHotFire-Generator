var gulp            = require('gulp');
var browserSync     = require('browser-sync').create();
var sass            = require('gulp-sass');
var autoprefixer    = require('gulp-autoprefixer');

gulp.task('serve', ['sass'], function() {

    browserSync.init({
        server: 'public',
        ghostMode: false,
		notify: false
    });

    gulp.watch('public/scss/*.scss', ['sass']);
    gulp.watch('public/js/*.js').on('change', browserSync.reload);
    gulp.watch('public/*.html').on('change', browserSync.reload);
});

gulp.task('sass', function() {
    return gulp.src('public/scss/style.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(autoprefixer({browsers: ['last 2 versions']}))
        .pipe(gulp.dest('public/css'))
        .pipe(browserSync.stream());
});

gulp.task('default', ['serve']);