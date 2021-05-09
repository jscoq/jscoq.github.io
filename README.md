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

TBD