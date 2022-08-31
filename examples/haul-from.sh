#!/bin/bash -e

D=$1

cp $D/*.html $D/*.v .

# touchup paths
is_gnu_sed() {
  sed --version >/dev/null 2>&1
}

if is_gnu_sed; then
    INPLACE="-i"
else
    INPLACE="-i ''"
fi

# need to adjust paths of jsCoq's entry point (`jscoq.js`).
# assumes each file has only one `import` statement.
for fn in *.html; do
    sed $INPLACE "s@from '[^']*.js'@from '../node_modules/jscoq/jscoq.js'@" $fn
done
