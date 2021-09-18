# jsCoq website

This repository holds the source files and scripts for building the
jsCoq public Website (https://coq.vercel.app).

It does not include the sources of jsCoq itself and the affiliated libraries.
These are located in their own repositories, and integration is done via NPM.
To build and deploy the site follow the recipe below.

## CI Recipe

### jsCoq + waCoq

 * In `jscoq` (https://github.com/jscoq/jscoq):
```sh
git pull   # make sure it's up to date
cd etc/docker
make ci
```

The `ci` target cleans previous Docker images and builds the JS and WA backends,
as well as the UI frontend and addons.
To build just JS, run `make clean && make js-build && js-dist`;
replace with `wa-build` and `wa-dist` for WA only.

 * In `jscoq.github.io` (this repo):
```sh
# jsCoq
git pull
rm -rf dist
ci/assemble.js -d ../jscoq/etc/docker/dist

# waCoq
cd  wa
rm -rf dist
ci/assemble.js -d ../../jscoq+wacoq/etc/docker/dist
```

To deploy, run `vercel`.

To set as production (coq.vercel.app), run `vercel --prod`.

To set as preview (coq-next.vercel.app), run
```
vercel alias set coq-p-wr.vercel.app coq-next.vercel.app
```


### Software Foundations

This step requires jsCoq SDK, which is not built by the Docker build script at the
moment (sorry). To build it locally, you need to install OCaml 4.12.0 and OPAM.

 * Preparation: create `wacoq` switch. (Only need to do once or if the required
   version of OCaml changes.)
```sh
opam switch create wacoq 4.12.0
```

 * In `wacoq-bin` (https://github.com/corwin-of-amber/wacoq-bin):
```sh
git pull
./etc/setup.sh
make coq && make install
```

Next are instructions for building the Software Foundations book with integrated jsCoq
on all pages. It is actually waCoq, because the JS version causes too many stack
overflows.

To clone (these flags are useful for faster checkout):
```sh
git clone --filter=blob:limit=1m --depth=1 -b jscoq git@github.com:DeepSpec/sfdev
```

 * In `sfdev`;
```sh
git pull       # unless you just cloned :)
rm -rf _built  # if you have some old build there
npm i .../wacoq-x.x.x.tar.gz   # with appropriate path & version
npm i                          # install remaining dependencies

eval `opam env --set-switch --switch=wacoq`
for vol in lf plf vfa slf; do
    ( cd $vol && make full TESTERS=no && make jscoq )
done
```

 * In `jscoq.github.io` (this repo):
```sh
git pull
cd ext/sf
./haul-from .../sfdev   # with appropriate path
```
