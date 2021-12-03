#!/usr/bin/env node

/**
 * Installs jsCoq and addons from a given directory.
 */

import fs from 'fs';
import path from 'path';
import glob from 'glob';
import child_process from 'child_process';
import fetch from 'node-fetch';
import Progress from 'node-fetch-progress';
import commander from 'commander';

import { PackageTarball } from './pkg-tarball.js';


function assemble(opts) {

    const o = commander
        //.option('-l, --link', 'create symbolic links instead of copying')
        .option('--npm [version]', 'Install from npm (using `version` if given, otherwise \"latest\")')
        .option('--build-context <switch>', 'Dune context in which to look for build artifacts',
                opts.DEFAULT_CONTEXT)
        .option('-c,--clean', 'Clean dist directory')
        .option('-d,--copy-dist', 'Copy files to dist directory before install')
        .parse();

    if (o.npm === true) o.npm = "latest";

    var ir = new Integration(opts),
        dist = new DistDir();

    if (o.clean) dist.clean();

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

        for (let subdir of [distRel, buildRel])
            dir = cd_maybe(dir, subdir);

        var tarballs = _pickAndChoose(glob.sync('**/*.@(tgz|tar.gz)', {cwd: dir})),
            toInstall = [];

        for (let fn of tarballs) {
            var fp = path.join(dir, fn),
                manifest = await new PackageTarball(fp).getManifest();

            if (manifest && manifest.name && (pkgMaster.includes(manifest.name) ||
                                              manifest.name.startsWith(pkgPrefix))) {
                console.log(`${manifest.name}@${manifest.version}  <--  ${fn}`);
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
        tarballs = _pickAndChoose(tarballs);
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

    /** hack to filter out the non-npm jsCoq tarball */
    function _pickAndChoose(tarballs) {
        return tarballs.filter(u => {
            var qual = u.replace('.t', '-npm.t');
            return qual == u || !tarballs.includes(qual);
        });
    }
        
    /* main entry point */
    async function consumeFromDirectories(locations, opts) {
        var toInstall = [];
        for (let loc of locations)
            toInstall.push(...await collectFrom(loc));
        
        if (toInstall.length > 0) {
            const npm = new NpmAdapter;
            try {
                await npm.install(toInstall);
            }
            catch (e) { return; }
        }

        if (opts.copyDist) {
            console.log('\n🍒 consolidating...');
            if (await dist.consolidate(ir.getDeployables()))
                return consumeFromDirectories([dist.dir], {});
        }

        if (toInstall.length > 0)
            console.log('\n🐿  ✔︎');
        else
            console.log('✘ no packages found.');
    }

    consumeFromDirectories(o.args, o);
}


class Integration {
    constructor(opts) { this.opts = opts; }

    getDependencies() {
        var m = JSON.parse(fs.readFileSync('package.json'));
        
        var p = {};
        for (let k of this.opts.pkgMaster || [])
            if (m.dependencies[k]) p[k] = m.dependencies[k];

        for (let k in m.dependencies) {
            if (k.startsWith(this.opts.pkgPrefix))
                p[k] = m.dependencies[k];
        }

        return p;
    }

    getInstalled() {
        var m = JSON.parse(fs.readFileSync('package-lock.json'));
        
        var p = {};
        for (let [k, v] of Object.entries(m.packages)) {
            p[path.basename(k)] = v.resolved;
        }

        return p;
    }

    getDeployables() {
        var p = this.getInstalled(), files = [],
            isMaster = k => this.opts.pkgMaster?.includes(k);

        for (let [k, v] of Object.entries(p)) {
            var mo = /^file:(.*)$/.exec(v);
            if (mo) {
                if (isMaster(k)) files.unshift(mo[1]);  // masters go first
                else files.push(mo[1]);
            }
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
        var toInstall = Object.keys(this.getDependencies()).map(nm => `${nm}@${ver}`);

        if (toInstall.length > 0) {
            const npm = new NpmAdapter;
            await npm.install(toInstall);
            console.log('🐿  ✔︎');
        }
        else console.log('✘ no packages found.');
    }
}


class DistDir {
    constructor(dir='dist') {
        this.dir = dir;
    }

    clean() {
        fs.rmSync(this.dir, {recursive: true, force: true});
    }

    download(url) {
        fs.mkdirSync(this.dir, {recursive: true});
        var fn = path.join(this.dir, url.replace(/.*[/]/, ''));
        return new Promise(async resolve =>
            withProgress(await fetch(url)).body.pipe(fs.createWriteStream(fn))
            .on('close', () => resolve(fn)));
    }

    copy(fp) {
        fs.mkdirSync(this.dir, {recursive: true});
        var fn = this.filename(fp);
        return new Promise(resolve => fs.copyFile(fp, fn, () => resolve(fn)));
    }

    filename(fn) {
        return path.join(this.dir, path.basename(fn));
    }

    includes(fn) {
        return path.normalize(this.dir) === path.normalize(path.dirname(fn));
    }

    async consolidate(pkgFilenames) {
        var changed = false;
        for (let fp of pkgFilenames) {
            if (!this.includes(fp)) {
                console.log(await this.copyAndRedirect(fp));
                changed = true;
            }
        }
        return changed;
    }

    redirectDeps(deps) {
        function redirectUri(uri) {
            var mo = /^(file:)(.*)$/.exec(uri);
            return mo ? mo[1] + path.basename(mo[2]) : uri;
        }
        return Object.fromEntries(Object.entries(deps)
            .map(([k, v]) => [k, redirectUri(v)]));
    }

    redirectPackageJson(pjson) {
        if (pjson.dependencies)
            pjson.dependencies = this.redirectDeps(pjson.dependencies);
        return pjson;
    }

    copyAndRedirect(fp) {
        fs.mkdirSync(this.dir, {recursive: true});
        var fn = this.filename(fp),
            s = new PackageTarball(fp).transformManifest(this.filename(fp),
                    pjson => this.redirectPackageJson(pjson));

        return new Promise(resolve =>
            s.on('finish', () => resolve(fn)));
    }
}

/* Since the programmatic API has been removed, use a child process */
class NpmAdapter {
    opts = ['--no-audit', '--no-fund']

    install(packages) {
        if (!Array.isArray(packages)) packages = [packages];

        var c = child_process.spawn('npm', ['install', ...this.opts, ...packages], {
            stdio: 'inherit'
        });
        return new Promise((resolve, reject) => {
            c.on('exit', (exitCode, signal) => {
                var e = {exitCode, signal};
                e.signal || e.exitCode ? reject(e) : resolve(e)
            })
        });
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


function isMain() {
    return (import.meta.url == `file://${process.argv[1]}`); // @@@ yuck
}


if (isMain()) {
    
    assemble({DEFAULT_CONTEXT: 'jscoq+64bit',
              pkgDir: './node_modules',
              pkgMaster: ['jscoq'],
              pkgPrefix: '@jscoq/',
              distRel: '_build/dist'});

}

export { assemble, Integration }
