# skeleton-loader

[![npm](https://img.shields.io/npm/v/skeleton-loader.svg)](https://www.npmjs.com/package/skeleton-loader) [![GitHub issues](https://img.shields.io/github/issues/anseki/skeleton-loader.svg)](https://github.com/anseki/skeleton-loader/issues) [![David](https://img.shields.io/david/anseki/skeleton-loader.svg)](package.json) [![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE-MIT)

Loader module for [webpack](https://webpack.js.org/) to execute your custom procedure. It works as your custom loader.

By default, skeleton-loader only outputs the input content. When you specify a function, skeleton-loader executes your function with the input content, and outputs its result. The function does something, it might edit the content, it might parse the content and indicate something in a console, it might do anything else.

That is, you can specify a function in webpack configuration instead of writing new custom loader.

skeleton-loader is useful when:

- You couldn't find a loader you want.
- You don't want to write a special loader for your project.
- You want to add something to the result of another loader.
- You want to do additional editing.
- etc.

For example:

```js
// webpack.config.js
module.exports = {
  entry: './app.js',
  output: {
    filename: 'bundle.js'
  },
  module: {
    rules: [{
      test: /\.js$/,
      loader: 'skeleton-loader',
      options: {
        procedure: function(content) {
          // Change the input content, and output it.
          return (content + '').replace(/foo/g, 'bar');
        }
      }
    }]
  }
};
```

```js
// webpack.config.js
// ...
test: /\.html$/,
// ...
// skeleton-loader options
options: {
  procedure: function(content) {
    // Remove all elements for testing from HTML.
    return (content + '').replace(/<div class="test">[^]*?<\/div>/g, '');
  },
  toCode: true
}
```

```js
// webpack.config.js
// ...
test: /\.json$/,
// ...
// skeleton-loader options
options: {
  procedure: function(content) {
    var appConfig = JSON.parse(content);
    // Check and change JSON.
    console.log(appConfig.foo);
    appConfig.bar = 'PUBLISH';
    return appConfig;
  },
  toCode: true
}
```

```js
// webpack.config.js
// ...
// skeleton-loader options
options: {
  // Asynchronous mode
  procedure: function(content, options, callback) {
    setTimeout(function() {
      callback(null, 'Edited: ' + content);
    }, 5000);
  }
}
```

## Installation

```
npm install --save-dev skeleton-loader
```

## Usage

Documentation:

- [Loaders](https://webpack.js.org/concepts/loaders/)
- [Using loaders](http://webpack.github.io/docs/using-loaders.html) (for webpack v1)

## Options

You can specify options via query parameters or an `options` (or `skeletonLoader` for webpack v1) object in webpack configuration.

### `procedure`

*Type:* function  
*Default:* `undefined`

A function to do something with the input content. The result of the `procedure` is output.  
The following arguments are passed to the `procedure`:

- `content`  
The content of the resource file as string, or something that is passed from previous loader. That is, if another loader is chained in `loaders` list, the `content` that is passed from that loader might not be string.
- `options`  
Reference to current options. This might contain either or both of `sourceMap` and `meta` if those are passed from previous loader. Also, it might contain [`options.resourceOptions`](#optionsresourceoptions).
- `callback`  
A callback function for asynchronous mode. If the `procedure` doesn't receive the `callback`, the loader works in synchronous mode.

In the `procedure` function, `this` refers to the loader context. It has `resourcePath`, `query`, etc. See: https://webpack.js.org/api/loaders/#the-loader-context

The result of the `procedure` can be any type such as `string`, `Object`, `null`, `undefined`, etc.  
For example:

```js
// app.js
var config = require('config.json');
```

```js
// webpack.config.js
// ...
// skeleton-loader options
options: {
  procedure: function(config) {
    if (initialize) {
      return; // make config be undefined
    }
    return process.env.NODE_ENV === 'production' ? config : {name: 'DUMMY'}; // data for test
  }
}
```

In synchronous mode, the `procedure` has to return the content. The content is output as JavaScript code, or passed to next loader if it is chained.

For example:

```js
// webpack.config.js
// ...
// skeleton-loader options
options: {
  procedure: function(content, options) {

    // Do something with content.
    console.log('Size: ' + content.length);
    content = (content + '').replace(/foo/g, 'bar'); // content might be not string.

    // Check the resource file by using context.
    if (this.resourcePath === '/abc/resource.js') {

      // Change current option.
      options.toCode = true;
    }

    // Return the content to output.
    return content;
  }
}
```

If the `procedure` receives the `callback`, the loader works in asynchronous mode. To return either or both of SourceMap and meta data, it must be asynchronous mode.  
In asynchronous mode, the `procedure` has to call the `callback` when it finished.

The `callback` accepts the following arguments:

- `error`  
An error object, when your procedure failed.
- `content`  
The content that is output as JavaScript code, or passed to next loader if it is chained. This can be any type such as `string`, `Object`, `null`, `undefined`, etc.
- `sourceMap`  
An optional value SourceMap as JavaScript object that is output, or passed to next loader if it is chained.
- `meta`  
An optional value that can be anything and is output, or passed to next loader if it is chained.

For example:

```js
// webpack.config.js
// ...
// skeleton-loader options
options: {
  procedure: function(content, options, callback) { // Switches to asynchronous mode
    // Do something asynchronously.
    require('fs').readFile('data.txt', function(error, data) {
      if (error) {
        // Failed
        callback(error);
      } else {
        // Done
        callback(null, data + content);
      }
    });
  }
}
```

#### `options.resourceOptions`

The `options` argument has `resourceOptions` property if a query string is specified with the resource file, and it is an object that is parsed query string.  
This is useful for specifying additional parameters when importing the resource files. For example, you can specify the behavior with resource files.

```js
var
  all = require('file.html'),
  noHead = require('file.html?removeHead=yes'),;
```

```js
// webpack.config.js
// ...
// skeleton-loader options
options: {
  procedure: function(content, options) {
    if (options.resourceOptions && options.resourceOptions.removeHead) {
      content = content.replace(/<head[^]*?<\/head>/, ''); // Remove <head>
    }
    return content;
  }
}
```

The query string is parsed in the same way as [loader-utils](https://github.com/webpack/loader-utils#options-as-query-strings).

### `toCode`

*Type:* boolean  
*Default:* `false`

When the content is not JavaScript code (e.g. HTML, CSS, JSON, etc.), a loader that is specified as a final loader has to convert the content to JavaScript code and output it to allow another code to import the content.  
If `true` is specified for `toCode` option, the content is converted to JavaScript code.  
If the loader is specified as not a final loader, this option is ignored (i.e. the content is not converted, and it is passed to next loader).

For example:

```js
// webpack.config.js
module.exports = {
  // ...
  module: {
    rules: [
      // HTML code is converted to JavaScript string.
      // It works same as raw-loader.
      {test: /\.html$/, loader: 'skeleton-loader?toCode=true'},

      // JSON data is converted to JavaScript object.
      // It works same as json-loader.
      {
        test: /\.json$/,
        loader: 'skeleton-loader',
        options: {
          procedure: function(content) { return JSON.parse(content); },
          toCode: true
        }
      }
    ]
  }
};
```

```js
// app.js
var html = require('file.html');
element.innerHTML = html;

var obj = require('file.json');
console.log(obj.array1[3]);
```

### `cacheable`

*Type:* boolean  
*Default:* `true`

Make the result cacheable.  
A cacheable loader must have a deterministic result, when inputs and dependencies haven't changed. This means the loader shouldn't have other dependencies than specified with [`context.addDependency`](https://webpack.js.org/api/loaders/#this-adddependency).  
Note that the default value is `true`.
