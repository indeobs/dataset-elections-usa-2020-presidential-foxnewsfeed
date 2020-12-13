#!/bin/sh

SERVER=$1

mkdir -p feeds-elections.foxnews.com/archive/politics/elections/
rsync -av $SERVER:feeds-elections.foxnews.com/archive/politics/elections/2020 feeds-elections.foxnews.com/archive/politics/elections/
