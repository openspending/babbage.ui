import 'isomorphic-fetch'
import Promise from 'bluebird'

var defaultDownloader = null;

export function getDefaultDownloader() {
  if (!defaultDownloader) {
    defaultDownloader = new Downloader();
  }
  return defaultDownloader;
}

export class Downloader {
  constructor() {
    this.cache = {};
  }

  get(url) {
    var that = this;
    if (this.cache[url]) {
      return Promise.resolve(this.cache[url]);
    } else {
      return fetch(url).then(function(response) {
        if (response.status >= 400) {
          return Promise.reject(new Error(`
            code: ${response.status},
            message: ${response.statusText}
          `));
        } else {
          return response.text()
        }
      }).then(function(text) {
        return that.cache[url] = text
      }).catch(Promise.reject);
    }
  }

  getJson(url) {
    return this.get(url)
      .then(JSON.parse)
      .catch(function(err) {
        console.error("getJson:", err)
      });
  }

  flush() {
    this.cache = {}
  }

}