#!/usr/bin/env node

import fs from 'fs';
import commander from 'commander';

import { Integration } from './assemble.js';


var ir = new Integration({
    pkgMaster: ['jscoq', 'wacoq', 'wacoq-bin']
});


function anxiety() {
    var files = ir.getDeployables();

    for (let fn of files) {
        console.log(`npm publish --access public ./${fn}`);
    }

    if (files.length == 0) console.warn('no packages to deploy');
}

function install(ver = 'latest') {
    var pkgs = Object.keys(ir.getPackages());
    console.log(`npm install ${pkgs.map(u => `${u}@${ver}`).join(' ')}`);
}


function main() {
    const p = new commander.Command();
    p.command('npm', {isDefault: true}).action(anxiety)
    p.command('website').action(() => install())
    p.parse(process.argv);
}

main();

