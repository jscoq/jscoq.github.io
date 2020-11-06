#!/usr/bin/env node
const fs = require('fs');


function getPackages() {
    var m = JSON.parse(fs.readFileSync('package.json'));
    
    var p = {jscoq: m.dependencies['jscoq']};  // make it first

    for (let k in m.dependencies) {
        if (k.startsWith('@jscoq/'))
            p[k] = m.dependencies[k];
    }

    return p;
}

function getDeployables() {
    var p = getPackages(), files = [];

    for (let v of Object.values(p)) {
        var mo = /^file:(.*)$/.exec(v);
        if (mo) files.push(mo[1]);
    }

    return files;
}

function anxiety() {
    var files = getDeployables();

    for (let fn of files) {
        console.log(`npm publish --access public ${fn}`);
    }

    if (files.length == 0) console.warn('no packages to deploy');
}

function install(ver = 'latest') {
    var pkgs = Object.keys(getPackages());
    console.log(`npm install ${pkgs.map(u => `${u}@${ver}`).join(' ')}`);
}


function main() {
    const p = new (require('commander').Command)();
    p.command('npm').action(anxiety)
    p.command('website').action(() => install())
    p.parse(process.argv);
}

main();

