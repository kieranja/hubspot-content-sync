
const path = require('path');
const fs = require('fs-extra');
const prettier = require('prettier');
const chalk = require('chalk');
const { program } = require('commander');

const HubSpotClient = require('./lib/hubspot-client');
const MissingTemplates = require('./lib/missing-templates');
const Mappings = require('./lib/mappings');
const { getIdFromPath, filterKeys, getCwd } = require('./lib/utils');


const SOURCE_PORTAL_HAPIKEY = '37287bd1-0c56-4d72-a5d2-e2dc14465a2c';
const DEST_PORTAL_HAPIKEY = '7ea40c72-2315-4e0d-b3da-acf57614f9dc';


const log = console.log;

// SOURCE  - enter HAPIKEY here
const hs = new HubSpotClient(SOURCE_PORTAL_HAPIKEY);

// DESTINATION - enter HAPIKEY here
const hsDestinationAPI = new HubSpotClient(DEST_PORTAL_HAPIKEY); 


const missingTemplatesInstance = new MissingTemplates(hsDestinationAPI);
const mappingsInstance = new Mappings();


/**
 * Only allow certain keys
 * @param {*} obj 
 * @param {*} allowList 
 */


const allowedKeys = [
    'id', 'campaign', 'campaign_name', 'footer_html', 'head_html', 'isDraft', 'meta_description',
    'keywords', 'name', 'password', 'publishDate', 'publish_immediately', 'slug', 'subcategory', 'widgetContainers',
    'widgets', 'templatePath', 'meta'
  ];


// i am lazy
async function getPages(ids) {
    const pages = await hs.getPages();

    if (typeof ids !== 'undefined' && ids.length > 0) {
        const objects = pages.objects;
        const filtered = objects.filter((page) => {
            return ids.indexOf(page.id.toString()) !== -1;
        })

        return filtered;
    }

    return pages.objects;
}

async function downloadContentPayload(pageId, pageData, dest) {
    dest = path.resolve(getCwd(), 'content/src/', `${pageId}.content.json`);
    const contentToWrite = JSON.stringify(pageData);
    const contentJson = prettier.format(contentToWrite, {
        parser: 'json',
    });

    await fs.outputFile(dest, contentJson);
    return { filePath: dest };
}

async function downloadAllPages(ids) {
    const pages = await getPages(ids);
    for (let i=0;i<pages.length;i++) {
        let page = pages[i];
        const filtered = filterKeys(page, allowedKeys);
        await downloadContentPayload(page.id, filtered)
    }

    return pages;
}

async function uploadSinglePage(sourcePageId) {
    const src = path.resolve(getCwd(), 'content/src/', `${sourcePageId}.content.json`);
    const data = await fs.readFile(src);
    const json = JSON.parse(data);
    const srcId = json.id;

    console.group('Uploading: ' + json.name + '/' + json.id);

    //console.log('Content processed for page: ' + json.name + ' / ' + json.id);

    let pageMapping = mappingsInstance.getPageMapping(srcId);

    // check dest id exists.
    if (pageMapping) { 
        // console.log('Overriding... existing');
        log(chalk.blue('Page already exists on dest according to mappings.json, so updating.'));
        delete json.slug;
        json.id = pageMapping;
    } else {
        delete json.id;
        log(chalk.green('This is a new page. Creating on dest.'));
    }

    const generatedTemplatePath = await getTemplateInfo(json.templatePath);

    if (generatedTemplatePath) {
        json.templatePath = generatedTemplatePath;   
    }

    const isMissingTemplateOnDest = missingTemplatesInstance.checkIsMissing(json);

    // We can't check for generated layouts.
    if (isMissingTemplateOnDest && !generatedTemplatePath) {
        let last = missingTemplatesInstance.getLast();
        log(chalk.red(`Template ${last.template}  missing on dest, skipping.`))

        console.groupEnd();
        return false;
    }

    try { 
        let res = await hsDestinationAPI.createOrUpdatePage(json);   
        mappingsInstance.addPageMapping(srcId, res.id);

        console.log('Content uploaded for page: ' + json.name + ' / ');
        log(chalk.green('Successful upload. Page ID on dest: ' + res.id));

    } catch (err) {
        console.log(JSON.stringify(err))
        console.log('error', err);
    }

    console.groupEnd();
}


async function uploadAllPages(filter) {
    const src = path.resolve(getCwd(), 'content/src/'); 

    const files = await fs.readdir(src);
    const filtered = files.filter(file => {
        return path.extname(file) == '.json' && file !== 'mappings.content.json';
    });

    for (let i=0;i<filtered.length;i++) {
        await uploadSinglePage(getIdFromPath(filtered[i]));
    }
}

const CACHE_TEMPLATES = null;
async function getNewTemplateIdByPath(path) {
    
    let templates = CACHE_TEMPLATES;
    if (!CACHE_TEMPLATES) {
        const destTemplates = await hsDestinationAPI.getLayouts(); 
        templates = destTemplates.objects;
    }

    for (let i=0;i<templates.length;i++) {
        if (templates[i].path == path) {
            return templates[i].generatedTemplatePath;
        }
    }

    // :/
    return false;
}


async function getTemplateInfo(strPath) {
    const id = getIdFromPath(strPath);

    if (!id) {
        return false;
    }

    let template;
    try {
        template =  await hs.getLayout(id);

    } catch(err) {
        return false;
    }

    if (!template) {
        return false;
    }
    const generatedPath = await getNewTemplateIdByPath(template.path);
    return generatedPath;
}




async function handler(args) {

    await mappingsInstance.init();
    await missingTemplatesInstance.init()

    if (args.ids) {
        const ids = args.ids;
        
        let split = ids.split(',');
        if (!split.length) {
            console.log('no ids provided');
            return;
        }
        split = split.map((id) => id.trim());
        let pagesProcessed = await downloadAllPages(split);

        for (let i=0;i<pagesProcessed.length;i++) {
            await uploadSinglePage(pagesProcessed[i].id);
        }
    }

    if (args.all) {
        await downloadAllPages();
        await uploadAllPages();
    }

    await mappingsInstance.flush(); 
}

program
  .command('sync')
  .option('-i, --ids [value]', 'List of page ids from source portal')
  .option('--all', 'you crazy, sync all')
  .action(handler);

program.parse(process.argv);
