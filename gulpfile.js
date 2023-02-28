// Khai báo các module được sử dụng
const { src, dest, watch, series, parallel } = require('gulp'),
    sass = require('gulp-sass')(require('sass')),
    browsersync = require('browser-sync').create(),
    del = require('del'),
    htmlhint = require('gulp-htmlhint'),
    sassGlob = require('gulp-sass-glob'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    cssdeclsort = require('css-declaration-sorter'),
    rename = require('gulp-rename'),
    htmlbeautify = require('gulp-html-beautify'),
    concat = require('gulp-concat'),
    pug = require('gulp-pug'),
    minify = require('gulp-clean-css'),
    terser = require('gulp-terser');
// imagemin = require('gulp-imagemin'),
// imagewebp = require('gulp-webp');

const paths = {
    dist: './dist',
    src: './src',
}

/* Browsersync Tasks */
const browser = (cb) => {
    browsersync.init({
        server: paths.dist
    });
    cb();
}

const clear = () => {
    return del(paths.dist)
}

const copy = () => {
    return src(`${paths.src}/assets/**/*`).pipe(dest(`${paths.dist}/assets/`))
}

const buildHTML = () => {
    return src([
        `${paths.src}/pug/**/*.pug`,
        `!${paths.src}/pug/**/_*.pug`
    ])
        .pipe(
            pug({
                pretty: true,
            })
        )
        .pipe(htmlbeautify({
            indent_size: 2,
            max_preserve_newlines: 1,
            end_with_newline: true
        }))
        .pipe(dest(paths.dist))
        .pipe(browsersync.stream())
}

const lintHTML = () => {
    return src(`${paths.dist}/**/*.html`)
        .pipe(htmlhint('.htmlhintrc'))
        .pipe(htmlhint.reporter())
}

/* CSS */
const buildCSS = () => {
    return src([
        `${paths.src}/sass/**/*.sass`,
        `!${paths.src}/sass/**/--*.sass`
    ])
        .pipe(sassGlob())
        .pipe(sass({
            outputStyle: 'expanded'
        }))
        .pipe(postcss([
            cssdeclsort({ order: 'smacss' }),
            autoprefixer({
                "overrideBrowserslist": ["last 2 versions", "ie >= 11", "Android >= 4"],
                cascade: false
            }),
        ]))
        // .pipe(minify())
        .pipe(dest(`${paths.dist}/assets/css/`))
        .pipe(browsersync.stream())
}

/* JS */
const copyJS = () => {
    return src(`${paths.src}/js/*.js`)
        // .pipe(terser())
        .pipe(dest(`${paths.dist}/assets/js/`))
}

/* IMAGES */
const copyIMG = () => {
    return src(`${paths.src}/assets/img/**/*`).pipe(dest(`${paths.dist}/assets/img/`))
}

/* FONTS */
const copyFONT = () => {
    return src(`${paths.src}/assets/font/**/*`).pipe(dest(`${paths.dist}/assets/font/`))
}

/* WATCHING */
const watchFiles = (cb) => {
    function reload(cb2) {
        browsersync.reload()
        cb2()
    }
    watch(`${paths.src}/assets/font/**/*`, series(copyFONT, reload))
    watch(`${paths.src}/assets/img/**/*`, series(copyIMG, reload))
    watch(`${paths.src}/js/*.js`, series(copyJS, reload))
    watch(`${paths.src}/sass/**/*.sass`, series(buildCSS))
    watch(`${paths.src}/pug/**/*.pug`, series(buildHTML))
    cb()
}

/* INIT */
const lint = parallel(lintHTML)
const build = series(clear, copy, parallel(buildHTML, buildCSS, copyJS, copyIMG, copyFONT))
const dev = series(build, parallel(browser, watchFiles))

exports.lint = lint
exports.build = build
exports.dev = dev