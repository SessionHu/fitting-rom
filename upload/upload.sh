#!/bin/sh

if [ "x$1" = "x" ]; then
    echo "No input file"
    exit 1
fi

if [ "x$2" = "x" ]; then
    echo "No cookie"
    exit 1
fi

if [ -e $1 ]; then
    sha512sum $1 | cut -d ' ' -f 1 >> $1
else 
    echo "File not found"
    exit 1
fi

if command -v node > /dev/null 2>&1; then
    node --version
else
    echo "Node.JS not found"
    exit 2
fi

if [ -e index.js ]; then
    node index.js $@
else
    echo "index.js not found"
    exit 2
fi

