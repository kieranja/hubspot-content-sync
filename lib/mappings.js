
const path = require('path');
const fs = require('fs-extra');
const {getCwd} = require('./utils');
const log = console.log;

module.exports = class Mappings {

    constructor() {
        this.file = path.resolve(getCwd(), 'content/src/', `mappings.content.json`);
        this.mappings = {
            pages: {}
        }
    }

    async init() {
        this.mappings = await this.getAll() || this.mappings;
    }


    addPageMapping(srcId, destId) {
        this.mappings.pages[srcId] = destId;
    }


    getPageMapping(srcId) {
        if (this.mappings.pages[srcId]) {
            return this.mappings.pages[srcId];
        }
        return null;
    }


    /**
     * 
     */
    async getAll() {

        try {
            const contents = await fs.readFile(this.file);
            if (contents) {
                const json = JSON.parse(contents);
                return json; 
            }

        } catch (err) {
            await fs.writeFile(this.file, JSON.stringify(this.mappings));
        }
        
        return null;
    }

    /**
     * flush to file.
     */
    async flush() {
        console.log(this.mappings);
        const json = JSON.stringify(this.mappings);
        fs.writeFile(this.file, json);
    }
}