CORE_DIR    := core
APP_DIR     := app
BINARY      := term-core
APP_NAME    := jebi
APP_BUNDLE  := $(APP_DIR)/dist/mac-arm64/$(APP_NAME).app
INSTALL_DIR := /Applications

.PHONY: all build build-core build-app deps install clean dev

all: build

## deps: download pre-built llama.cpp binaries for the current architecture
deps:
	bash scripts/download-deps.sh

## build: compile Go core + package Electron app into term.app
build: deps build-core build-app

build-core:
	cd $(CORE_DIR) && go build -o $(BINARY) .

build-app:
	cd $(APP_DIR) && npm run build && npm run pack

## install: move term.app into /Applications
install:
	@if [ ! -d "$(APP_BUNDLE)" ]; then \
		echo "Run 'make build' first."; exit 1; \
	fi
	rm -rf "$(INSTALL_DIR)/$(APP_NAME).app"
	cp -r "$(APP_BUNDLE)" "$(INSTALL_DIR)/$(APP_NAME).app"
	@echo "Installed → $(INSTALL_DIR)/$(APP_NAME).app"

## dev: build Go core then start Electron dev server
dev: deps
	cd $(CORE_DIR) && go build -o $(BINARY) . && cd ../$(APP_DIR) && \
	{ [ -d node_modules ] && [ package.json -ot node_modules ] || npm install; } && \
	npm run dev

## clean: remove build artifacts
clean:
	rm -f $(CORE_DIR)/$(BINARY)
	rm -rf $(APP_DIR)/dist $(APP_DIR)/out
