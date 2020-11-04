
BASEDIR = ..
JSCOQ_SRC = $(BASEDIR)/../jscoq

.PHONY: from-docker serve


#########################
# Deploy from Docker
#

JSCOQ_DOCKER = $(JSCOQ_SRC)/etc/docker/dist

from-docker:
	cd $(BASEDIR) && \
	npm i $(JSCOQ_DOCKER)/jscoq-*-npm.tar.gz $(JSCOQ_DOCKER)/jscoq-[a-z]*.tgz


##################
# Dev server
#

PORT = 8080

serve:
	npx http-server $(BASEDIR) -c10 -p $(PORT)
