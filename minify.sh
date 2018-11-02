#!/bin/bash
rm static/js/gnossiennes.min.js
java -jar ../closure-compiler/closure-compiler-v20181008.jar --js static/js/*.js --js_output_file static/js/gnossiennes.min.js
