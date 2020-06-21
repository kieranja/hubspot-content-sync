
const chalk = require('chalk');
const log = console.log;

module.exports = class MissingTemplates {

    constructor(api) {
        this.missing = [];
        this.templates = {};
        this.api = api;
    }

    async init() {
        const templates = await this.api.getTemplates();
        const templateObjects = templates.objects;
        for (let i=0;i<templateObjects.length;i++) {
            this.templates[templateObjects[i].path] = true;
        }

        log(chalk.green('Found the following templates on destination site:'));
        console.table(this.templates);
    }

    checkIsMissing(page) {
        if (!this.templates[page.templatePath]) {
            this.missing.push({srcPageId: page.id, template: page.templatePath});
            return true;
        }
        return false;
    }
    getLast() {
        return this.missing[this.missing.length-1];
    }

    getAll(){
        return this.missing;
    }
}