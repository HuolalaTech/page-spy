#!/bin/bash

# 1. Check whether the latest version description have updated to the CHANGELOG.md
package_json="library/oh-package.json5"
changelog="library/CHANGELOG.md"
har="library/build/default/outputs/default/library.har"

version=$(jq -r ".version" "$package_json")
echo "Latest version for @huolala/page-spy-harmony: $version"

match=$(grep -o "$version" "$changelog")
if [ -z "$match" ]; then
    echo "Error: the $version description not found in CHANGELOG.md"
else
    echo "Check done. The result is OK"
fi