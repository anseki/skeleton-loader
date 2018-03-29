'use strict';

var loaderUtils = require('loader-utils');

module.exports = function(content, sourceMap, meta) {
  var context = this,
    options = loaderUtils.getOptions(context) || {};

  function getResult(content) {
    return context.loaderIndex === 0 && options.toCode
      ? 'module.exports = ' + JSON.stringify(content) + ';' : content;
  }

  options.cacheable = typeof options.cacheable === 'boolean' ? options.cacheable : true;
  options.cacheable && context.cacheable && context.cacheable();
  if (typeof context.resourceQuery === 'string' && context.resourceQuery) {
    options.resourceOptions = loaderUtils.parseQuery(context.resourceQuery);
  }
  options.sourceMap = sourceMap;
  options.meta = meta;

  if (typeof options.procedure === 'function') {
    content = options.procedure.call(context, content, options,
      function(error, content, sourceMap, meta) {
        if (error) {
          context.callback(error);
        } else {
          context.callback(null, getResult(content), sourceMap, meta);
        }
      });

    if (options.procedure.length >= 3) { // async mode
      if (!context.async()) { throw new Error('Asynchronous mode is not allowed'); }
      return;
    }
  }

  return getResult(content);
};
