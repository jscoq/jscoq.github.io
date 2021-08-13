#!/bin/bash

D=$1
VOLUMES="lf plf vfa slf"

ok=1

for subdir in common _built/coq-pkgs ; do
    fn=$D/$subdir
    if [ -d $fn ] ; then echo "✓ $fn";
        rm -rf $subdir
        cp -R $fn .
    else echo "✗ $fn"; ok=0; fi
done

fn=$D/tools
if [ -d $fn ] ; then echo "✓ $fn";
    rm -rf tools
    mkdir tools
    cp $fn/jscoq-tester.html tools/
else echo "✗ $fn"; ok=0; fi

for vol in $VOLUMES ; do
    fn=$D/_built/$vol/full
    if [ -d $fn ] ; then echo "✓ $fn"; 
        rm -rf $vol/full
        mkdir -p $vol/full
        cp -R $fn/*.html $vol/full/
        (cd $vol/full && ln -s ../../common .)
    else echo "✗ $fn"; ok=0; fi
done

if [ $ok != 1 ] ; then echo 'error: some directories are missing'; exit 1; fi

# touchup paths
is_gnu_sed() {
  sed --version >/dev/null 2>&1
}

if is_gnu_sed; then
    INPLACE="-i"
else
    INPLACE="-i ''"
fi

sed $INPLACE 's/(.*\/\(node_modules\/.*jscoq-splash.png\))/(\/wa\/\1)/' common/css/jscoq.css
sed $INPLACE 's/".*\/\(node_modules\/.*jscoq-loader.js\)"/"\/wa\/\1"/' */full/*.html
sed $INPLACE "s/'..\/_built'/'..'/" tools/jscoq-tester.html
