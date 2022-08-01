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

# need to adjust paths of jsCoq's helper scripts and stylesheets
# (esp. `jscoq-loader.js`, `jscoq-agent.js`, `jscoqdoc.css`)
for fn in *.html; do
    sed $INPLACE 's@[^"]*/ui-\(js\|css\)@../node_modules/jscoq/ui-\1@g' $fn
done
