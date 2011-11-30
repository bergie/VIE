#!/bin/bash

# Install ANT
sudo apt-get install -y ant

# Build VIE with ANT
ant

# Install NodeUnit
npm install -g nodeunit

# Install dependencies
npm install --dev
