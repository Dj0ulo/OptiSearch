import os
import json
import shutil

# read manifest_v3.json
with open('manifest_v3.json', 'r') as f:
    data = json.load(f)

# get content script js and webaccesible ressources
content_scripts = data['content_scripts']

scripts = content_scripts[0]['js']
resources = data['web_accessible_resources'][0]['resources']
popup_html = data['action']['default_popup']

optisearch_dir = '../OptiSearch/'

files = []
files += [optisearch_dir + data['background']['service_worker']]
files += [optisearch_dir + script for script in scripts]
# loop in resources and add them to files, if one is directory, add all files in it
for resource in resources:
    if resource[-1] == '*' and os.path.isdir(optisearch_dir + resource[:-1]):
        dir = optisearch_dir + resource[:-1]
        for file in os.listdir(dir):
            files.append(dir + file)
    else:
        files.append(optisearch_dir + resource)

# get parent dir of popup_html
popup_parent_dir = optisearch_dir + os.path.dirname(popup_html)

# add popup_parent_dir files to files
for file in os.listdir(popup_parent_dir):
    files.append(popup_parent_dir + '/' + file)

# delete all files in src folder
os.system('wsl rm -rf src')

# copy files to src folder, conserve the folder structure, creates directory based on the path of the file
os.system('wsl mkdir src')
for file in files:
    directory = os.path.dirname(file[len(optisearch_dir):])
    if not os.path.exists(directory):
        os.makedirs(directory)
    filename = os.path.basename(file)
    shutil.copy(file, directory + '/' + filename)