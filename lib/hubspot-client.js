
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');

module.exports = class HubSpotClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.hubapi.com/content/api/v4/';
    }

    // stolen from hubspot client lib... forgive me please
    async createRequest(uri, options, props = {}) {
        const url = this.baseUrl + uri + '?hapikey=' + this.apiKey;

        try {
          const method = options.method || 'GET';
          const headers = {};
          const timeout = 30000;
          const data = options.body || {};
          return axios({ url, method, headers, timeout, data }).then(
            response => response.data
          );
        } catch (e) {
          return Promise.reject(e);
        }
      }


    async getPages() {
        const pages = await this.createRequest('pages', {method: 'GET'});
        return pages;
    }

    async getLayouts() {
        const layouts = await this.createRequest('layouts', {method: 'GET'});
        return layouts;
    }
    async getTemplates() {
        const templates = await this.createRequest('templates', {method: 'GET'});
        return templates;
    }


    async createOrUpdatePage(obj) {
        const path = obj.id ? 'pages/' + obj.id : 'pages';
        const method = obj.id ? 'PUT' : 'POST';
        const pages = await this.createRequest(path, {method: method, body: obj});
        return pages;
    }

    async getLayout(id) {
        const layout = await this.createRequest('layouts/' + id, {method: 'GET'});
        return layout;
    }

}