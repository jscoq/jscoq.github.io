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

# applies to `jscoq-loader` and `jscoq-agent`
for fn in *.html; do
    sed $INPLACE 's@[^"]*/jscoq-@../node_modules/jscoq/ui-js/jscoq-@g' $fn
done
