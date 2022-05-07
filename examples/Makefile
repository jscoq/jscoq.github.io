.PHONY: all clean

COQC = npx jscoq sdk coqc
JSCOQ_CLI = npx jscoq

all: examples.coq-pkg # sqrt_2.html nahas_tutorial.html

examples.coq-pkg: ${addprefix _build/, nahas_tutorial.vo sqrt_2.vo}
	$(JSCOQ_CLI) build --package examples --rootdir _build --no-recurse \
		--top Examples

_build/%.v: %.v
	mkdir -p _build && cp $< _build/

_build/%.vo: _build/%.v
	$(COQC) -R _build Examples $<

%.html: _build/%.v _build/%.vo
	JSCOQ_URL=.. ../ui-js/jscoqdoc.js --no-index --no-lib-name --parse-comments $<
	@rm coqdoc.css  # urghh

clean:
	rm -rf _build examples.coq-pkg examples.json

cleanup:
	rm -rf _build
