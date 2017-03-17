'use strict';

var loaderUtils = require('loader-utils');

module.exports = function(content, sourceMap) {
  var context = this,
    options = loaderUtils.getOptions(context) || {},
    undef;

  function getResult(content) {
    return context.loaderIndex === 0 && options.toCode ?
      'module.exports = ' + JSON.stringify(content) + ';' :
      content;
  }

  options.cacheable = typeof options.cacheable === 'boolean' ? options.cacheable : true;
  options.cacheable && context.cacheable && context.cacheable();
  if (typeof context.resourceQuery === 'string' && context.resourceQuery) {
    options.resourceOptions = loaderUtils.parseQuery(context.resourceQuery);
  }

  if (typeof options.procedure === 'function') {
    content = options.procedure.call(context, content, sourceMap, function(error, content, sourceMap) {
      if (error) {
        context.callback(error);
      } else {
        context.callback(null, getResult(content), sourceMap);
      }
    }, options);

    if (content == null) { // async mode
      if (!context.async()) {
        throw new Error('Asynchronous mode is not allowed');
      }
      return undef;
    }
  }

  return getResult(content);
};
