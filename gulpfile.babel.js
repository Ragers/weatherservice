'use strict';

import plugins  from 'gulp-load-plugins';
import browserify from 'browserify';
import yargs    from 'yargs';
import browser  from 'browser-sync';
import gulp     from 'gulp';
import panini   from 'panini';
import rimraf   from 'rimraf';
import sherpa   from 'style-sherpa';
import yaml     from 'js-yaml';
import fs       from 'fs';
import globby   from 'globby';
import through  from 'through2';
import source   from 'vinyl-source-stream';
import buffer   from 'vinyl-buffer';
import reactify from 'reactify';
import batchReplace from 'gulp-batch-replace';
import html2jsbrowserify from 'html2js-browserify';

// Load all Gulp plugins into one variable
const $ = plugins();

// Check for --production flag
const PRODUCTION = !!(yargs.argv.production);

const TEST = !!(yargs.argv.test);

// Load settings from config.yml
const { ROOTS, SITE_PAGES, COMPATIBILITY, PORT, PATHS } = loadYML('config.yml');

function loadYML(file){
    return yaml.load(fs.readFileSync(file, 'utf8'));
}

// Build the "dist" folder by running all of the below tasks
gulp.task('build',
    gulp.series(clean, gulp.parallel(pages, sass, javascript, images, copy, templates, fonts, css, scripts)));

// Build the site, run the server, and watch for file changes
gulp.task('dev', gulp.series('build', server, watch));
gulp.task('default', gulp.series('build'));

// Delete the "dist" folder
// This happens every time a build starts
function clean(done) {
    rimraf(PATHS.dist, done);
}

// Copy files out of the assets folder
// This task skips over the "img", "js", and "scss" folders, which are parsed separately
function copy() {
    return gulp.src(PATHS.assets)
        .pipe(gulp.dest(PATHS.dist + '/assets'));
}

// Copy HTML Templates to the "dist" folder
// In production, the HTML are compressed
function templates() {
    var stream = gulp.src(PATHS.templates)
        .pipe($.htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(PATHS.dist + '/templates'));
    return stream;
}

// Copy all used fonts to the dist css/fonts folder
function fonts() {
    return gulp.src(PATHS.fonts)
        .pipe(gulp.dest(PATHS.dist + '/assets/css/fonts'));
}

// Copy all non SASS css files to the dist css/components folder
function css() {
    return gulp.src(PATHS.css)
        .pipe(gulp.dest(PATHS.dist + '/assets/css/components'));
}

// Copy any custom JavaScript items to the dist js/ folder
function scripts() {
    return gulp.src(PATHS.scripts)
        .pipe(gulp.dest(PATHS.dist + '/assets/js'));
}

// Copy page templates into finished HTML files
// All pages handles here in the /src/pages/ folder except for /src/pages/tours/
// Tours are handled in the "tours()" method
function pages() {
    var stream = gulp.src(PATHS.pages)
        .pipe(panini(ROOTS))
        .pipe($.htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(PATHS.dist));
    return stream;
}

// Load updated HTML templates and partials into Panini
function resetPages(done) {
    panini.refresh();
    done();
}

// Compile Sass into CSS
// In production, the CSS is compressed
function sass() {
    return globby(PATHS.sasscss).then(function (entries) {
        for(var i = 0; i<entries.length; i++) {
            var entry = entries[i];
            gulp.src(entry)
                .pipe($.sourcemaps.init())
                .pipe($.sass({
                    includePaths: PATHS.sass
                })
                    .on('error', $.sass.logError))
                .pipe($.autoprefixer({
                        browsers: COMPATIBILITY
                    })
                )
                //.pipe($.bless())
                .pipe($.cssnano())
                // .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
                .pipe(gulp.dest(PATHS.dist + '/assets/css'))
                .pipe(browser.reload({ stream: true }));
        }
    }).catch(function (err) {});
}

// Combine JavaScript into one file
// In production, the file is minified
function javascript() {
    // browserify all files mapped in the config.yml => javascript:
    var bundledStream = through();
    var mainScripts = '';

    // Start processing all scriptsa
    for(var i = 0; i<PATHS.javascript.length; i++){
        var entry = PATHS.javascript[i];
        var name = entry.replace("src/assets/js/components","");
        name = name.replace("src/assets/js","");
        name = name.replace('.js','.min.js');
        if(i==0){
            mainScripts = name;
        }

        bundledStream
            .pipe(source(entry))
            .pipe(buffer())
            .pipe($.sourcemaps.init({loadMaps: true}))
            .pipe($.concat(name))
            .pipe($.if(PRODUCTION, $.uglify({compress: true})
                .on('error', e => {
                    console.log(e);
                })
            ))
            .pipe($.if(name==mainScripts,gulp.dest(PATHS.dist + '/assets/js/components')));
    }

    // Bundle all the scripts together into one single JavaScript file "normally scripts.min.js"
    globby(PATHS.javascript).then(function (entries) {
        var b = browserify({
            entries: entries,
            debug: true,
            transform: [reactify,html2jsbrowserify]
        });
        b.bundle()
            .pipe(bundledStream)
            .on('error', e => {
                console.log(e);
            });

    }).catch(function (err) {
        bundledStream.emit('error', err);
    });

    // return the bundled process stream to see if all scripts successfully compiled
    return bundledStream;
}

// Copy images to the "dist" folder
// In production, the images are compressed
function images() {
    return gulp.src(PATHS.images)
        .pipe($.imagemin({
            progressive: true
        }))
        .pipe(gulp.dest(PATHS.dist + '/assets/img'));
}

// Start a server with BrowserSync to preview the site in
function server(done) {
    browser.init({
        port: PORT,
        // https: true,
        server: {
            baseDir: PATHS.dist,
            middleware: function(req,res,next){
                // set CORS headers so  that localhost can access API calls.
                res.setHeader('Access-Control-Allow-Origin','*');
                next();
            }
        }
    });
    done();
}

// Reload the browser with BrowserSync
function reload(done) {
    browser.reload();
    done();
}

// Watch for changes to static assets, pages, Sass, and JavaScript
function watch() {
    gulp.watch(PATHS.assets, copy);
    gulp.watch('src/pages/**/*.html').on('all', gulp.series(pages, browser.reload));
    gulp.watch('src/templates/**/*.html').on('all', gulp.series(templates,javascript, browser.reload));
    gulp.watch('src/{layouts,partials}/**/*.html').on('all', gulp.series(resetPages, pages, browser.reload));
    gulp.watch('src/assets/scss/**/*.scss').on('all', gulp.series(sass, browser.reload));
    gulp.watch('src/assets/js/**/*.js').on('all', gulp.series(javascript, browser.reload));
    gulp.watch('src/assets/img/**/*').on('all', gulp.series(images, browser.reload));
}
