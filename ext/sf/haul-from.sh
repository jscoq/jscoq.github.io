#!/bin/bash

D=$1
VOLUMES="lf plf vfa slf"

is_gnu_sed() {
  sed --version >/dev/null 2>&1
}

if is_gnu_sed; then
    INPLACE="-i"
else
    INPLACE="-i ''"
fi


ok=1

# note: not copying `_build/coq-pkgs`, instead `@wacoq/software-foundations`
# from npm is going to be used
for subdir in common ; do
    fn=$D/$subdir
    if [ -d $fn ] ; then echo "✓ $fn";
        rm -rf $subdir
        cp -R $fn .
    else echo "✗ $fn"; ok=0; fi
done

# touchup paths (files in common/ need to be processed before the volumes)
sed $INPLACE 's/(.*\/\(node_modules\/.*jscoq-splash.png\))/(\/wa\/\1)/' common/css/jscoq.css
sed $INPLACE "s/'.*\/\(node_modules\/.*jscoq.js\)'/'\/wa\/\1'/" common/jscoq.js 
sed $INPLACE "s/\(all_pkgs:\).*/\1 ['coq', 'software-foundations'],/" common/jscoq.js

fn=$D/tools
if [ -d $fn ] ; then echo "✓ $fn";
    rm -rf tools
    mkdir tools
    cp $fn/jscoq-tester.html tools/
else echo "✗ $fn"; ok=0; fi

for vol in $VOLUMES ; do
    for cut in full terse ; do
        fn=$D/_built/$vol/$cut
        if [ -d $fn ] ; then echo "✓ $fn"; 
            rm -rf $vol/$cut
            mkdir -p $vol/$cut
            cp -R $fn/*.html $vol/$cut
            (cd $vol/$cut && cp -r ../../common .)
        else echo "✗ $fn"; ok=0
        fi
    done
done

if [ $ok != 1 ] ; then echo 'error: some directories are missing'; exit 1; fi

sed $INPLACE "s/'..\/_built'/'..'/" tools/jscoq-tester.html

# Fix the home link
sed $INPLACE 's/\(<div id=.logoinheader.><a href=\)[^>]*\(>\)/\1"\/ext\/sf"\2/' */*/*.html
