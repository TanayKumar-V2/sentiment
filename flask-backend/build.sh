#!/bin/bash

# Exit if any command fails
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Download NLTK stopwords data
python -m nltk.downloader stopwords