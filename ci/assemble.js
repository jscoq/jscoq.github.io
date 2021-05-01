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
      concat = require('concat-stream'),
      fetch = require('node-fetch'),
      Progress = require('node-fetch-progress');


function assemble(opts) {

    const o = require('commander')
        //.option('-l, --link', 'create symbolic links instead of copying')
        .option('--npm [version]', 'Install from npm (using `version` if given, otherwise \"latest\")')
        .option('-c,--build-context <switch>', 'Dune context in which to look for build artifacts',
                opts.DEFAULT_CONTEXT)
        .option('-d,--copy-dist', 'Copy files to dist directory before install')
        .parse();

    if (o.npm === true) o.npm = "latest";

    var ir = new Integration(opts),
        dist = new DistDir();

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
                    stream.on('end', () => next());

                    if (header.name == 'package/package.json') {
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
                if (o.copyDist) fp = await dist.copy(fp);
                toInstall.push(ir.fileLocation(fp));
            }
        }

        return toInstall;
    }

    async function collectFromHttp(url) {
        var base = new URL(url),
            index = await (await fetch(base)).text(),
            tarballs = [...index.matchAll(/"([^"]*\.(tgz|tar.gz))"/g)]
                .map(mo => new URL(mo[1], url).href);
        /* hack to filter out the non-npm jsCoq tarball */
        tarballs = tarballs.filter(u => {
            var qual = u.replace('.t', '-npm.t');
            return qual == u || !tarballs.includes(qual);
        });
        var toInstall = [];
        for (let u of tarballs) {
            console.log(` <--  ${u}`);
            if (o.copyDist) u = ir.fileLocation(await dist.download(u));
            toInstall.push(u);
        }
        return toInstall;
    }

    function collectFrom(dir_or_url) {
        return dir_or_url.match(/^https?:/) ? collectFromHttp(dir_or_url)
            : collectFromDirectory(dir_or_url);
    }

        
    /* main entry point */
    async function consumeFromDirectories(locations) {
        var toInstall = [];
        for (let loc of locations)
            toInstall.push(...await collectFrom(loc));
        
        if (toInstall.length > 0) {
            const npm = require('global-npm');
            await new Promise(resolve => npm.load(resolve));
            await new Promise(resolve => npm.commands.install(toInstall, resolve));
            console.log('\n🐿  ✔︎');
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
            var mo = /^(file|https?):(.*)$/.exec(v);
            if (mo) files.push(mo[1][0] == 'h' ? mo[0] : mo[2]);
        }

        return files;
    }
    
    listDeployables() {
        var files = this.getDeployables();

        for (let fn of files) console.log(fn);
    }

    fileLocation(fp) {
        return fp.startsWith('/') ? fp : `./${fp}`;  /* for `npm install */
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


class DistDir {
    constructor(dir='dist') {
        this.dir = dir;
    }

    download(url, dir=this.dir) {
        mkdirp.sync(dir);
        var fn = path.join(dir, url.replace(/.*[/]/, ''));
        return new Promise(async resolve =>
            withProgress(await fetch(url)).body.pipe(fs.createWriteStream(fn))
            .on('close', () => resolve(fn)));
    }

    copy(fp, dir=this.dir) {
        mkdirp.sync(dir);
        var fn = path.join(dir, path.basename(fp));
        return new Promise(resolve => fs.copyFile(fp, fn, () => resolve(fn)));
    }
}

/* helper function for downloading dist files over HTTP */
function withProgress(response) {
    const blnk = ' '.repeat(40),
          poke = (s) => process.stderr.write(`\r${blnk}\r${s}`);
    new Progress(response, { throttle: 100 })
        .on('progress', (p) => poke(`  ${p.doneh}/${p.totalh}`))
        .on('finish', () => poke(''));
    return response;
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
else module.exports = {assemble};
