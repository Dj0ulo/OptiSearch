import os
import json
import shutil

optisearch_dir = './'
build_dir = './build/'

# read manifest.json
with open('manifest.json', 'r') as f:
    data = json.load(f)

# get content script js and webaccesible ressources
content_scripts = data['content_scripts']

scripts = []
for cs in content_scripts:
    scripts += [s for s in cs['js']]

resources = []
for res in data['web_accessible_resources']:
    resources += res['resources']
popup_html = data['action']['default_popup']
icons = data['icons'].values()

files = []
files += [data['background']['service_worker']]
files += [script for script in scripts]
files += [r['path'] for r in data['declarative_net_request']['rule_resources']]
files += [ic for ic in data['icons'].values()]
# loop in resources and add them to files, if one is directory, add all files in it
for resource in resources:
    if resource[-1] == '*' and os.path.isdir(resource[:-1]):
        dir = resource[:-1]
        for file in os.listdir(dir):
            files.append(dir + file)
    else:
        files.append(resource)

# get parent dir of popup_html
popup_parent_dir = os.path.dirname(popup_html)

# add popup_parent_dir files to files
for file in os.listdir(popup_parent_dir):
    files.append(popup_parent_dir + '/' + file)

# delete all files in src folder
os.system('wsl rm -rf '+build_dir)
os.makedirs(build_dir)


# copy files to src folder, conserve the folder structure, creates directory based on the path of the file
shutil.copy('manifest.json', build_dir)
os.system('wsl cp -r _locales '+build_dir)
os.system('wsl mkdir '+build_dir+'src')
for file in files:
    print(file)
    directory = build_dir+os.path.dirname(file)
    if not os.path.exists(directory):
        os.makedirs(directory)
    filename = os.path.basename(file)
    shutil.copy(optisearch_dir + file, directory + '/' + filename)