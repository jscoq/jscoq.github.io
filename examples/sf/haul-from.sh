#!/bin/bash

D=$1

ok=1

for vol in lf plf ; do
    fn=$D/$vol/full
    if [ -d $fn ] ; then echo "✓ $fn"; 
        rm -rf $vol/full
        mkdir -p $vol/full
        cp -R $fn/{common,*.html} $vol/full/
    else echo "✗ $fn"; ok=0; fi
done

if [ $ok != 1 ] ; then echo 'error: some directories are missing'; exit 1; fi
