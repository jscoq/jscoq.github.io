#!/usr/bin/env node

/**
 * Installs waCoq and addons from a given directory.
 */

import { assemble } from  '../../ci/assemble.js';


    
assemble({DEFAULT_CONTEXT: 'wacoq',
            pkgDir: './node_modules',
            pkgMaster: 'wacoq',
            pkgPrefix: '@wacoq/',
            distRel: '_'});


