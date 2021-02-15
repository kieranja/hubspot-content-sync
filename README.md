# Hubspot content sync
syncs content from src -> dest on hubspot CMS

!!! use at your own risk !!!

Usage:
1. npm install
2. Open index.js
3. Update 
```
const SOURCE_PORTAL_HAPIKEY = '';
const DEST_PORTAL_HAPIKEY = '';
```

4. create content/src folder
5. run one of the commands below (i recommend syncing one piece of content first)


### cowboy:
```
node index.js sync --all
```
### sane:
```
node index.js sync --ids=123,124,125
```

ids should be the page ids from the SOURCE portal.

You'll need to have uploaded your templates to the destination portal first. This tool downloads all of the pages from the source portal and stores in them content/src. A mapping is maintained in src/mappings.content.json. If you run the same page id's again it'll update them instead of creating a new one. If you delete pages from the DEST them this tool will complain, so you'll need to cleanup mappings.json. 

