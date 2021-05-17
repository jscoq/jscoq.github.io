.PHONY: all

JSCOQ_URL = ../../wa/node_modules/wacoq
JSCOQDOC = ../../wa/node_modules/.bin/wacoqdoc

export JSCOQ_URL

all: nahas_tutorial.html

nahas_tutorial.html: nahas_tutorial.v
	mkdir -p _build && cp $< _build/
	coqc _build/$<
	$(JSCOQDOC) --no-index --no-lib-name --parse-comments _build/$<
	@rm coqdoc.css  # urghh
