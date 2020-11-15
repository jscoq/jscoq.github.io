
BASEDIR = ..
JSCOQ_SRC = ../jscoq
JSCOQ_ADDONS_SRC = ../jscoq-addons

.PHONY: from-docker serve


#########################
# Deploy from Docker
#

JSCOQ_DOCKER = $(JSCOQ_SRC)/etc/docker/dist
JSCOQ_ADDONS_DOCKER = $(JSCOQ_ADDONS_SRC)/software-foundations/etc/docker/dist

from-docker:
	cd $(BASEDIR) && \
	npm i $(JSCOQ_DOCKER)/jscoq-*-npm.tar.gz $(JSCOQ_DOCKER)/jscoq-[a-z]*.tgz \
	      ${foreach a,$(JSCOQ_ADDONS_DOCKER),$(a)/jscoq-*.tgz}

##################
# Dev server
#

PORT = 8080

serve:
	npx http-server $(BASEDIR) -c10 -p $(PORT)


########################
# Actual deployment
#
publish-npm:
	cd $(BASEDIR) && node ci/ship-it.js npm
