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
make clean && make && make dist
```

 * In `jscoq.github.io` (this repo):
```sh
git pull
ci/assemble.js -d ../jscoq/etc/docker/dist
```

To deploy, run `vercel`.

To set as production (coq.vercel.app), run `vercel --prod`.

To set as preview (coq-next.vercel.app), run
```
vercel alias set coq-p-wr.vercel.app coq-next.vercel.app
```

### waCoq

No Dockerfile yet (sorry), you need to install OCaml 4.10.2, OPAM, Node.js, NPM,
and [wasi-sdk 12](https://github.com/WebAssembly/wasi-sdk/releases/tag/wasi-sdk-12).

 * Preparation: create `wacoq` switch.
```sh
opam switch create wacoq 4.10.2
```

 * In `wacoq-bin` (https://github.com/corwin-of-amber/wacoq-bin):
```sh
git pull
./etc/setup.sh
make coq && make && make dist-npm && make install
npm link    # makes `wacoq` cli available
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
make CONTEXT=wacoq
make CONTEXT=wacoq set-ver
make CONTEXT=wacoq pack
```

 * In `jscoq.github.io` (this repo):
```sh
git pull
cd wa
ci/assemble.js -d ../../jscoq+wacoq ../../jscoq-addons
```
