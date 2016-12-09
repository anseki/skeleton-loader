'use strict';

var loaderUtils = require('loader-utils');

module.exports = function(content, sourceMap) {
  var options = loaderUtils.getLoaderConfig(this, 'skeletonLoader'),
    asyncCb;

  function getResult(content) {
    return options.raw ? content : 'module.exports = ' + JSON.stringify(content) + ';';
  }

  options.raw = typeof options.raw === 'boolean' ? options.raw : this.loaderIndex > 0;
  options.cacheable = typeof options.cacheable === 'boolean' ? options.cacheable : true;
  options.cacheable && this.cacheable && this.cacheable();

  if (typeof options.procedure === 'function') {
    if (options.async) {
      // async mode
      if (!(asyncCb = this.async())) {
        throw new Error('Asynchronous mode is not allowed');
      }
      options.procedure(content, sourceMap, function(error, content, sourceMap) {
        if (error) {
          asyncCb(error);
        } else {
          asyncCb(null, getResult(content), sourceMap);
        }
      }, this, options);
      return null;
    }
    // sync mode
    content = options.procedure(content, sourceMap, asyncCb, this, options);
  }

  return getResult(content);
};
