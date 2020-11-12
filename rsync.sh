#!/bin/sh

SERVER=$1

rsync -av $SERVER:2020 feeds-elections.foxnews.com/archive/politics/elections/
