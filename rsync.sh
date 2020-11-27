#!/bin/sh

SERVER=$1

rsync -av $SERVER:feeds-elections.foxnews.com/archive/politics/elections/2020 feeds-elections.foxnews.com/archive/politics/elections/
