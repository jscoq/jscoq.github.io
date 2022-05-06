#!/bin/bash -e

D=$1

cp $D/*.html $D/examples.* .

# touchup paths
is_gnu_sed() {
  sed --version >/dev/null 2>&1
}

if is_gnu_sed; then
    INPLACE="-i"
else
    INPLACE="-i ''"
fi

for fn in *.html; do
    sed $INPLACE 's@[^"]*/jscoq-loader@../node_modules/jscoq/ui-js/jscoq-loader@g' $fn
done
