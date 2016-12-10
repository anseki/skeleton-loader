'use strict';

var loaderUtils = require('loader-utils');

module.exports = function(content, sourceMap) {
  var context = this,
    options = loaderUtils.getLoaderConfig(context, 'skeletonLoader'),
    asyncCb;

  function getResult(content) {
    return context.loaderIndex === 0 && options.toCode ?
      'module.exports = ' + JSON.stringify(content) + ';' :
      content;
  }

  options.cacheable = typeof options.cacheable === 'boolean' ? options.cacheable : true;
  options.cacheable && context.cacheable && context.cacheable();

  if (typeof options.procedure === 'function') {
    if (options.async) {
      // async mode
      if (!(asyncCb = context.async())) {
        throw new Error('Asynchronous mode is not allowed');
      }
      options.procedure.call(context, content, sourceMap, function(error, content, sourceMap) {
        if (error) {
          asyncCb(error);
        } else {
          asyncCb(null, getResult(content), sourceMap);
        }
      }, options);
      return null;
    }
    // sync mode
    content = options.procedure.call(context, content, sourceMap, asyncCb, options);
  }

  return getResult(content);
};
