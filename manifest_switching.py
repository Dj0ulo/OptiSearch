import os

files = [f for f in os.listdir('.') if 'manifest' in f]

if 'manifest_firefox.json' in files:
    os.rename('manifest.json', 'manifest_chrome.json')
    os.rename('manifest_firefox.json', 'manifest.json')
    print("Switched to firefox")

if 'manifest_chrome.json' in files:
    os.rename('manifest.json', 'manifest_firefox.json')
    os.rename('manifest_chrome.json', 'manifest.json')
    print("Switched to chrome")

