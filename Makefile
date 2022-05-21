JSCOQ_DIR = $(PWD)/../jscoq
DIST_DIR = $(JSCOQ_DIR)/etc/docker/dist

.PHONY: assemble js-assemble wa-assemble sfdev-assemble serve ci

assmeble: | js-assemble wa-assemble sfdev-assemble examples-assemble ci

js-assemble:
	ci/assemble.js -cd $(DIST_DIR)

wa-assemble:
	# this is a wrinkle
	# cp $(DIST_DIR)/wacoq-bin-*.tar.gz wa/dist
	# cd wa && npm i ./dist/wacoq-bin-*.tar.gz &&
	cd wa && ci/assemble.js -cd $(DIST_DIR)


examples-assemble:
	cd examples && ./haul-from.sh $(JSCOQ_DIR)/examples
	make -C examples
	make -C examples cleanup

SFDEV_DIR = $(HOME)/var/ext/sfdev

sfdev-rebuild:
	cd $(SFDEV_DIR) && DIST_DIR=$(PWD)/wa/dist V=0.15.1 $(PWD)/ext/sf/_ci

sfdev-assemble:
	cd ext/sf && ./haul-from.sh $(SFDEV_DIR)

ci: | js-assemble wa-assemble examples-assemble sfdev-rebuild sfdev-assemble

serve:
	npx http-server
