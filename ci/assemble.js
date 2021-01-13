#!/usr/bin/env node

/**
 * Installs jsCoq and addons from a given directory.
 */


const fs = require('fs'),
      path = require('path'),
      glob = require('glob'),
      mkdirp = require('mkdirp'),
      tar = require('tar-stream'),
      gunzip = require('gunzip-maybe'),
      concat = require('concat-stream');

const DEFAULT_CONTEXT = 'jscoq+64bit';

const opts = require('commander')
    //.option('-l, --link', 'create symbolic links instead of copying')
    .option('-c,--build-context <switch>', 'Dune context in which to look for build artifacts',
            DEFAULT_CONTEXT)
    .parse();

const pkgDir = './node_modules',
      pkgMaster = 'jscoq',
      pkgPrefix = '@jscoq/',
      distRel = '_build/dist',
      buildRel = `_build/${opts.buildContext}`;

async function collectFromDirectory(dir) {

    function getManifest(filename) {
      
        function peek(cb) {
            var e = tar.extract();
            e.on('entry', (header, stream, next) => {
                stream.on('end', function() { next() });

                if (path.basename(header.name) == 'package.json') {
                    stream.pipe(concat(d => { try { cb(JSON.parse(d)); } catch { } } ));
                }
                else stream.resume() // just drain the stream so that we can continue
            });
            e.on('finish', () => cb());
            return e;
        }

        return new Promise(resolve =>
            fs.createReadStream(filename).pipe(gunzip()).pipe(peek(resolve)));
    }

    for (let subdir of [distRel, buildRel])
        dir = cd_maybe(dir, subdir);

    var toInstall = [];

    for (let fn of glob.sync('**/*.@(tgz|tar.gz)', {cwd: dir})) {
        var fp = path.join(dir, fn),
            manifest = await getManifest(fp);

        if (manifest && manifest.name && (manifest.name == pkgMaster ||
                                          manifest.name.startsWith(pkgPrefix))) {
            console.log(`${manifest.name}@${manifest.version}  <--  ${fn}`);
            toInstall.push(fp);
        }
    }

    return toInstall;
}

function cd_maybe(dir, rel) {
    var d = path.join(dir, rel);
    try {
        if (fs.statSync(d).isDirectory()) return d
    }
    catch {}
    return dir;
}

async function consumeFromDirectories(dirs) {
    var toInstall = [];
    for (let dir of dirs)
        toInstall.push(...await collectFromDirectory(dir));
    
    const npm = require('global-npm');
    await npm.load(() => { });
    await new Promise(resolve => npm.commands.install(toInstall, resolve));
    console.log('🐿  ✔︎');
}


consumeFromDirectories(opts.args);
