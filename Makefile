JSCOQ_DIR = $(PWD)/../jscoq
DIST_DIR = $(JSCOQ_DIR)/etc/docker/dist

.PHONY: assemble js-assemble wa-assemble sf-assemble serve ci

assemble: | js-assemble wa-assemble sf-assemble examples-assemble

js-assemble:
	ci/assemble.js -cd $(DIST_DIR)

wa-assemble:
	cd wa && ci/assemble.js -cd $(DIST_DIR)


examples-assemble:
	cd examples && ./haul-from.sh $(JSCOQ_DIR)/examples
	make -C examples
	make -C examples cleanup

SFDEV_DIR = $(HOME)/var/ext/sfdev

sf-rebuild:
	cd $(SFDEV_DIR) && DIST_DIR=$(PWD)/wa/dist V=0.16.0 $(PWD)/ext/sf/_ci

sf-assemble:
	cd ext/sf && ./haul-from.sh $(SFDEV_DIR)

ci: | js-assemble wa-assemble examples-assemble sf-rebuild sf-assemble

serve:
	npx http-server
