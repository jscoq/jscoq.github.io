
BASEDIR = ..
JSCOQ_SRC = ../jscoq

ADDON_PKGS = elpi equations extlib simpleio mathcomp quickchick software-foundations \
	     hahn paco snu-sflib promising
 
EXCLUDE = software-foundations

NPM_PKGS = 

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
