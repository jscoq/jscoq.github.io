# jsCoq website

This repository holds the source files and scripts for building the
jsCoq public Website (https://coq.vercel.app).

It does not include the sources of jsCoq itself and the affiliated libraries.
These are located in their own repositories, and integration is done via NPM.
To build and deploy the site follow the recipe below.

## CI Recipe

### jsCoq

 * In `jscoq` (https://github.com/jscoq/jscoq):
```sh
git pull   # make sure it's up to date
cd etc/docker
make ci
```

 * In `jscoq.github.io` (this repo):
```sh
git pull
rm -rf dist
ci/assemble.js -d ../jscoq/etc/docker/dist
```

To deploy, run `vercel`.

To set as production (coq.vercel.app), run `vercel --prod`.

To set as preview (coq-next.vercel.app), run
```
vercel alias set coq-p-wr.vercel.app coq-next.vercel.app
```

### waCoq

No Dockerfile yet (sorry), you need to install OCaml 4.12.0, OPAM, Node.js, NPM,
and [wasi-sdk 12](https://github.com/WebAssembly/wasi-sdk/releases/tag/wasi-sdk-12).
The build scripts assume that the latter is installed in the standard location, `/opt/wasi-sdk`.

 * Preparation: create `wacoq` switch.
```sh
opam switch create wacoq 4.12.0
```

 * In `wacoq-bin` (https://github.com/corwin-of-amber/wacoq-bin):
```sh
git pull
./etc/setup.sh
make ci
```

 * In `jscoq+wacoq` (https://github.com/jscoq/jscoq/tree/v8.13+wacoq):
```sh
git pull
npm i ../wacoq-bin/wacoq-bin-x.x.x.tar.gz   # with appropriate path & version
npm i                      # install remaining dependencies
make && make dist-npm
```
 * In `jscoq-addons` (https://github.com/jscoq/addons):
```sh
git pull && git submodule update
make CONTEXT=wacoq ci
```

 * In `jscoq.github.io` (this repo):
```sh
git pull
cd wa
rm -rf dist
ci/assemble.js -d ../../jscoq+wacoq ../../jscoq-addons
```

### Software Foundations

To clone (these flags are useful for faster checkout):
```sh
git clone --filter=blob:limit=1m --depth=1 -b jscoq git@github.com:DeepSpec/sfdev
```

 * In `sfdev`;
```sh
git pull       # unless you just cloned :)
rm -rf _built  # if you have some old build there
npm i ../jscoq+wacoq/wacoq-x.x.x.tar.gz   # with appropriate path & version
npm i                      # install remaining dependencies
opam switch wacoq && eval `opam env`
( cd lf && make full TESTERS=no && make jscoq )
( cd plf && make full TESTERS=no && make jscoq )
```

 * In `jscoq.github.io` (this repo):
```sh
git pull
cd ext/sf
./haul-from ../sfdev   # with appropriate path
```
