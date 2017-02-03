# skeleton-loader

[![npm](https://img.shields.io/npm/v/skeleton-loader.svg)](https://www.npmjs.com/package/skeleton-loader) [![GitHub issues](https://img.shields.io/github/issues/anseki/skeleton-loader.svg)](https://github.com/anseki/skeleton-loader/issues) [![David](https://img.shields.io/david/anseki/skeleton-loader.svg)](package.json) [![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE-MIT)

Loader module for [webpack](http://webpack.github.io/) to execute your custom procedure. It works as your custom loader.

By default, skeleton-loader only outputs the input content. When you specify a function, skeleton-loader executes your function with the input content, and outputs its result. The function does something, it might edit the content, it might parse the content and indicate something in a console, it might do anything else.

That is, you can specify a function in webpack configuration instead of writing new custom loader.

skeleton-loader is useful when:

- You couldn't find a loader you want.
- You don't want to write a special loader for your project.
- You want to add something to the result of another loader.
- You want to do additional editing.
- etc.

For example:

**webpack v2**

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
      use: [{
        loader: 'skeleton-loader',
        options: {
          procedure: function(content) {
            // Change the input content, and output it.
            return (content + '').replace(/foo/g, 'bar');
          }
        }
      }]
    }]
  }
};
```

**webpack v1**

```js
// webpack.config.js
module.exports = {
  entry: './app.js',
  output: {
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {test: /\.js$/, loader: 'skeleton-loader'}
    ]
  },
  // skeleton-loader options
  skeletonLoader: {
    procedure: function(content) {
      // Change the input content, and output it.
      return (content + '').replace(/foo/g, 'bar');
    }
  }
};
```

```js
// webpack.config.js
// ...
test: /\.html$/,
// ...
// skeleton-loader options
{
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
{
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
{
  // Asynchronous mode
  procedure: function(content, sourceMap, callback) {
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

[Documentation: Using loaders](http://webpack.github.io/docs/using-loaders.html)

## Specifying Options

There are three ways to specify [options](#options).

* Query parameters
* `options` (webpack v2) or `skeletonLoader` (webpack v1) object in webpack configuration
* Specified property in webpack configuration (webpack v1)

### Query parameters

You can specify the options via query parameters. See: http://webpack.github.io/docs/using-loaders.html#query-parameters

Note that a function can not be specified via the query parameters. Use webpack configuration to specify it.

For example:

```js
// app.js
var data = require('skeleton-loader?toCode=true!./data.txt');
```

### `options` (webpack v2) or `skeletonLoader` (webpack v1)

You can specify the options via an `options` (webpack v2) or `skeletonLoader` (webpack v1) object in webpack configuration.

For example:

**webpack v2**

```js
// webpack.config.js
module.exports = {
  // ...
  module: {
    rules: [{
      test: /\.js$/,
      use: [{
        loader: 'skeleton-loader',
        options: {
          procedure: function(content) {
            return (content + '').replace(/foo/g, 'bar');
          }
        }
      }]
    }]
  }
};
```

**webpack v1**

```js
// webpack.config.js
module.exports = {
  // ...
  module: {
    loaders: [
      {test: /\.js$/, loader: 'skeleton-loader'}
    ]
  },
  // skeleton-loader options
  skeletonLoader: {
    procedure: function(content) {
      return (content + '').replace(/foo/g, 'bar');
    }
  }
};
```

### Specified property (webpack v1)

You can specify a name via a `config` query parameter, and you can specify the options via an object that has this name in webpack configuration.  
This is useful for switching the options by each file or condition.

For example:

```js
// app.js
var
  data1 = require('skeleton-loader?config=optionsA!./file-1.js'),
  data2 = require('skeleton-loader?config=optionsB!./file-2.js');
// Or, you can specify these parameters in webpack configuration.
```

```js
// webpack.config.js
module.exports = {
  // ...
  // options-A
  optionsA: {
    procedure: function(content) {
      return (content + '').replace(/foo/g, 'barA');
    }
  },
  // options-B
  optionsB: {
    procedure: function(content) {
      return (content + '').replace(/foo/g, 'barB');
    }
  }
};
```

## Options

### `procedure`

*Type:* function  
*Default:* `undefined`

A function to do something with the input content. The result of the function is output.  
The function is passed the following arguments:

- `content`  
The content of the resource file as string, or something that is passed by previous loader. That is, if another loader is chained in `loaders` list, the `content` that is passed by that loader might not be string.
- `sourceMap`  
An optional value SourceMap as JavaScript object that might be passed by previous loader.
- `callback`  
A callback function for asynchronous mode.
- `options`  
Reference to current options.

In the function, `this` refers to the loader context. It has `resourcePath`, `query`, etc. See: http://webpack.github.io/docs/loaders.html#loader-context

In synchronous mode, the `procedure` function has to return the content. The content is output as JavaScript code, or passed to next loader if it is chained.

For example:

```js
// webpack.config.js
// ...
// skeleton-loader options
{
  procedure: function(content, sourceMap, callback, options) {

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

If the `procedure` function returns nothing (or returns `undefined` or `null`), the loader works in asynchronous mode. To return a SourceMap, it must be asynchronous mode.  
In asynchronous mode, the `procedure` function has to call the `callback` function when it finished.

The `callback` function accepts the following arguments:

- `error`  
An error object, when your procedure failed.
- `content`  
The content that is output as JavaScript code, or passed to next loader if it is chained.
- `sourceMap`  
An optional value SourceMap as JavaScript object that is output, or passed to next loader if it is chained.

For example:

```js
// webpack.config.js
// ...
// skeleton-loader options
{
  procedure: function(content, sourceMap, callback) {
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

### `toCode`

*Type:* boolean  
*Default:* `false`

When the content is not JavaScript code (e.g. HTML, CSS, JSON, etc.), a loader that is specified as a final loader has to convert the content to JavaScript code and output it to allow another code to import the content.  
If `true` is specified for `toCode` option, the content is converted to JavaScript code.  
If the loader is specified as not a final loader, this option is ignored (i.e. the content is not converted, and it is passed to next loader).

For example:

**webpack v2**

```js
// webpack.config.js
module.exports = {
  // ...
  module: {
    rules: [
      // HTML code is converted to JavaScript string.
      // It works same as raw-loader.
      {test: /\.html$/, use: [{loader: 'skeleton-loader?toCode=true'}]},

      // JSON data is converted to JavaScript object.
      // It works same as json-loader.
      {
        test: /\.json$/,
        use: [{
          loader: 'skeleton-loader',
          options: {
            procedure: function(content) { return JSON.parse(content); },
            toCode: true
          }
        }]
      }
    ]
  }
};
```

**webpack v1**

```js
// webpack.config.js
module.exports = {
  // ...
  module: {
    loaders: [
      // HTML code is converted to JavaScript string.
      // It works same as raw-loader.
      {test: /\.html$/, loader: 'skeleton-loader?toCode=true'},

      // JSON data is converted to JavaScript object.
      // It works same as json-loader.
      {test: /\.json$/, loader: 'skeleton-loader?config=optJson'}
    ]
  },
  optJson: {
    procedure: function(content) { return JSON.parse(content); },
    toCode: true
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
A cacheable loader must have a deterministic result, when inputs and dependencies haven't changed. This means the loader shouldn't have other dependencies than specified with [`context.addDependency`](http://webpack.github.io/docs/loaders.html#adddependency).  
Note that the default value is `true`.
