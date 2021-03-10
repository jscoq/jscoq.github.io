#!/usr/bin/env node

/**
 * Installs waCoq and addons from a given directory.
 */

const {assemble} = require('../../ci/assemble');


if (module.id === '.') {
    
    assemble({DEFAULT_CONTEXT: 'wacoq',
              pkgDir: './node_modules',
              pkgMaster: 'wacoq',
              pkgPrefix: '@wacoq/',
              distRel: '_'});

}

