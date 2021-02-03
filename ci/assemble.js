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


function assemble(opts) {

    const o = require('commander')
        //.option('-l, --link', 'create symbolic links instead of copying')
        .option('--npm [version]', 'Install from npm (using `version` if given, otherwise \"latest\")')
        .option('-c,--build-context <switch>', 'Dune context in which to look for build artifacts',
                opts.DEFAULT_CONTEXT)
        .parse();

    if (o.npm === true) o.npm = "latest";

    var ir = new Integration(opts);

    if (o.npm) {
        if (o.npm == 'ls')
            ir.listDeployables();
        else
            ir.fromNPM(o.npm);
        return;
    }

    const {pkgDir, pkgMaster, pkgPrefix, distRel} = opts,
          buildRel = `_build/${o.buildContext}`;

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

    async function consumeFromDirectories(dirs) {
        var toInstall = [];
        for (let dir of dirs)
            toInstall.push(...await collectFromDirectory(dir));
        
        if (toInstall.length > 0) {
            const npm = require('global-npm');
            await npm.load(() => { });
            await new Promise(resolve => npm.commands.install(toInstall, resolve));
            console.log('🐿  ✔︎');
        }
        else console.log('✘ no packages found.');
    }

    consumeFromDirectories(o.args);
}


class Integration {
    constructor(opts) { this.opts = opts; }

    getPackages() {
        var m = JSON.parse(fs.readFileSync('package.json'));
        
        var p = {}, k = this.opts.pkgMaster;
        if (m.dependencies[k]) p[k] = m.dependencies[k];

        for (let k in m.dependencies) {
            if (k.startsWith('@jscoq/'))
                p[k] = m.dependencies[k];
        }

        return p;
    }

    getDeployables() {
        var p = this.getPackages(), files = [];

        for (let v of Object.values(p)) {
            var mo = /^file:(.*)$/.exec(v);
            if (mo) files.push(mo[1]);
        }

        return files;
    }
    

    listDeployables() {
        var files = this.getDeployables();

        for (let fn of files) console.log(fn);
    }

    async fromNPM(ver = 'latest') {
        var toInstall = Object.keys(this.getPackages()).map(nm => `${nm}@${ver}`);

        if (toInstall.length > 0) {
            const npm = require('global-npm');
            await npm.load(() => { });
            await new Promise(resolve => npm.commands.install(toInstall, resolve));
            console.log('🐿  ✔︎');
        }
        else console.log('✘ no packages found.');
    }
}


function cd_maybe(dir, rel) {
    var d = path.join(dir, rel);
    try {
        if (fs.statSync(d).isDirectory()) return d
    }
    catch {}
    return dir;
}


if (module.id === '.') {
    
    assemble({DEFAULT_CONTEXT: 'jscoq+64bit',
              pkgDir: './node_modules',
              pkgMaster: 'jscoq',
              pkgPrefix: '@jscoq/',
              distRel: '_build/dist'});

}
