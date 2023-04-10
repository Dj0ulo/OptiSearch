"""
Usage: python3 manifest.py [optisearch|bingchat] [2|3]
Default: optisearch, 3
"""
import sys
import shutil
import json

if __name__ == "__main__":
    base_manifest = "manifest_optisearch.json"
    if 'bingchat' in sys.argv:
        base_manifest = "manifest_bingchat.json"
    if '2' not in sys.argv:
        shutil.copy(base_manifest, "manifest.json")
        exit(0)

    # Load the version 3 manifest file
    with open(base_manifest, "r") as f:
        manifest_v3 = json.load(f)

    # Create an empty dictionary for the version 2 manifest
    manifest_v2 = {}

    # Add the required fields to the version 2 manifest
    manifest_v2["manifest_version"] = 2
    manifest_v2["name"] = manifest_v3["name"]
    manifest_v2["version"] = manifest_v3["version"]
    manifest_v2["description"] = manifest_v3["description"]

    # Add the optional fields to the version 2 manifest, if they are present in the version 3 manifest
    if "default_locale" in manifest_v3:
        manifest_v2["default_locale"] = manifest_v3["default_locale"]
    if "author" in manifest_v3:
        manifest_v2["author"] = manifest_v3["author"]
    if "icons" in manifest_v3:
        manifest_v2["icons"] = manifest_v3["icons"]
    if "action" in manifest_v3:
        manifest_v2["browser_action"] = manifest_v3["action"]
    if "background" in manifest_v3:
        manifest_v2["background"] = {
            "scripts": [manifest_v3["background"]["service_worker"]]
        }
    if "content_scripts" in manifest_v3:
        manifest_v2["content_scripts"] = manifest_v3["content_scripts"]
    if "permissions" in manifest_v3:
        manifest_v2["permissions"] = manifest_v3["permissions"]
    # Add host permissions to the version 2 manifest, if they are present in the version 3 manifest
    if "host_permissions" in manifest_v3:
        manifest_v2["permissions"] += manifest_v3["host_permissions"]

    # Add web accessible resources to the version 2 manifest, if they are present in the version 3 manifest
    if "web_accessible_resources" in manifest_v3:
        manifest_v2["web_accessible_resources"] = manifest_v3["web_accessible_resources"][0]["resources"]

    # Save the version 2 manifest file
    with open("manifest.json", "w") as f:
        json.dump(manifest_v2, f, indent=4)
