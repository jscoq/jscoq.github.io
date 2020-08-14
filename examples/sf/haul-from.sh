#!/bin/bash

D=$1

ok=1

fn=$D/common
if [ -d $fn ] ; then echo "✓ $fn";
    rm -rf common
    cp -R $fn .
else echo "✗ $fn"; ok=0; fi

for vol in lf plf ; do
    fn=$D/$vol/full
    if [ -d $fn ] ; then echo "✓ $fn"; 
        rm -rf $vol/full
        mkdir -p $vol/full
        cp -R $fn/*.html $vol/full/
        (cd $vol/full && ln -s ../../common .)
    else echo "✗ $fn"; ok=0; fi
done

if [ $ok != 1 ] ; then echo 'error: some directories are missing'; exit 1; fi
