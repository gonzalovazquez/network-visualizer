#!/bin/bash

# Purpose: Build a single Network Visualizer image
#
# Author: Gonzalo Vazquez, gonzalovazquez010@gmail.com
#
# Parameters:
# $1: Version of Network Visualizer image to build
#

xVERSION=$1

if [ -z $1 ]; then
   echo "Missing version"
   exit
fi

echo "Building Network Visualizer..."
npm run dist
echo "Network Visualizer built"
echo "Building Docker image with version $xVERSION"
docker build -t gonzalovazquez/networkvisualizer:$xVERSION -t gonzalovazquez/networkvisualizer:latest . --no-cache=true
echo "Imaging built with version $xVERSION"
