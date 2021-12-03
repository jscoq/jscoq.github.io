DIST_DIR = $(PWD)/../jscoq/etc/docker/dist

js-assemble:
	ci/assemble.js -cd $(DIST_DIR)

wa-assemble:
	# this is a wrinkle
	cp $(DIST_DIR)/wacoq-bin-*.tar.gz wa/dist
	cd wa && npm i ./dist/wacoq-bin-*.tar.gz && \
	ci/assemble.js -cd $(DIST_DIR)


SFDEV_DIR = $(HOME)/var/ext/sfdev

sfdev-assemble:
	cd ext/sf && ./haul-from.sh $(SFDEV_DIR)
