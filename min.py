#!/usr/bin/env python3

from bs4 import BeautifulSoup
from zipfile import ZipFile, ZIP_DEFLATED
import os
import shutil
import subprocess

# name of our dev html file. we'll pull all js files out of here
dev = 'dev.html'
index = 'index.html'
# closure compiler method. options SIMPLE, ADVANCED and WHITESPACE_ONLY 
optimise = 'SIMPLE'
# destination for our concatented and compressed js file 
compressed = 'g.js'
# files to be included in the zip
files = ['index.html', 'b.png', 't.png', 'manifest.appcache', 'favicon.ico', compressed]
# target folder for all our zip files
folder = 'game'

# grab all scripts from our dev html for concatentation 
dev_file = open(dev, 'r', encoding='utf-8')
html = dev_file.read()
dev_file.close()
soup = BeautifulSoup(html, 'html.parser')
concat_js = open('all.js', 'w', encoding='utf-8')

scripts = soup.findAll(['script'])
for script in scripts:
    if script.get('src'):
        src = open(script['src'], 'r', encoding='utf-8')
        concat_js.write(src.read())
        src.close()
concat_js.close()


# minify the concatenated JavaScript locally
npx = 'npx.cmd' if os.name == 'nt' else 'npx'
subprocess.run(
    [npx, '--yes', 'terser', 'all.js', '--compress', '--mangle', '--output', compressed],
    check=True,
)


# update our index.html to mirror dev.html
dev_file = open(dev, 'r', encoding='utf-8')
html = dev_file.read() 
dev_file.close()

soup = BeautifulSoup(html, 'html.parser')

# remove all script tags
for tag in soup.findAll('script'):
    tag.extract()

# append final script tag to body
script = soup.new_tag('script')
script["src"] = compressed
soup.body.append(script)

index_file = open(index, 'w', encoding='utf-8')
index_file.write(soup.prettify())
index_file.close()

with open(index, 'r', encoding='utf-8') as index_file:
    index_html = index_file.read()
index_html = index_html.replace('<html>', '<html manifest="manifest.appcache">', 1)
with open(index, 'w', encoding='utf-8') as index_file:
    index_file.write(index_html)

# create folder for our game, if it doesnt exist
if not os.path.exists(folder):
    os.makedirs(folder)

# copy files into folder (to avoid creating a zip bomb)
for filename in files:
    shutil.copy2(filename, os.path.join(folder, filename))


# zip all our files
zf = ZipFile(folder + '.zip', 'w', ZIP_DEFLATED)
for filename in files:
    zf.write(os.path.join(folder, filename), filename)
zf.close()

# and a bit of a cleanup
shutil.rmtree(folder)

# finally, tell us how much we've squeezed in
total = os.path.getsize(folder + '.zip')
remaining = 13312 - total
print('Total used:', total)
print('Bytes remaining:', remaining)
