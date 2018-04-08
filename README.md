# retriever

`retriever` is a small utility library for retrieving nested data safely. It contains several improvements over solutions like `lodash.get`, such as:
- **Type checking**: Ensure that accessed data is of the exact type that is needed.
- **Optional logging**: Log warnings in cases of required data that is missing or of the wrong type.
- **Convenient defaults**: Retrieving data looks for strings by default, and also provides extra utility for objects.

## Installation

```sh
npm install @ebay/retriever --save
```

## Usage

```js
var r = require('@ebay/retriever');

// set optional logger for missing data or type mismatch with defaultValue
r.setLogger(function (message) {}); // used with need(), or with truthy last param with get() and has()

// sample data where content is not guaranteed
var input = {
    model: {
        action: {
            url: 'https://www.ebay.com/sch/iphone'
            textSpans: [
                {
                    text: 'Search for iphone on eBay'
                }
            ]
        },
        list: [1, 2, 3],
        count: 20,
        disabled: true
    }
};

// cache parent when accessing multiple children
var action = r.need(input, 'model.action', {}); // input.model.action (from object)

// assumed defaultValue is empty string if none is provided
var text = r.need(action, 'textSpans[0].text'); // 'Search for iphone on eBay' (from object)

// {} is transformed to contain helper property when used as default
var content = r.need(action, 'model.content', {}); // {__isEmpty: true} (from defaultValue)

// use has() when presence is needed, but not the actual data
var hasContent = r.has(input, 'model.content'); // false

// type of defaultValue must match type of data, otherwise will log
var count = r.need(input, 'model.count', 50); // 20 (from object)
var count = r.need(input, 'model.count', '50'); // '50' (from defaultValue), will log
var count = r.get(input, 'model.count', '50', true); // '50' (from defaultValue), will log
var count = r.get(input, 'model.count', '50'); // '50' (from defaultValue), will not log

// defaults to defaultValue when data is missing or of mismatched type
var list = r.need(input, 'model.missingProperty', []); // [] (from defaultValue)
var list = r.need(input, 'model.list'); // '' (from default defaultValue)
var list = r.need(input, 'model.list', ''); // '' (from defaultValue)
var list = r.need(input, 'model.list', {}); // {__isEmpty: true} (from defaultValue)
var list = r.need(input, 'model.list', 0); // 0 (from defaultValue)
var list = r.need(input, 'model.list', false); // false (from defaultValue)
var list = r.need(input, 'model.list', []); // [1, 2, 3] (from object)

// use get() if logging isn't necessary
var disabled = r.get(input, 'model.disabled', false); // true (from object)
var enabled = r.get(input, 'model.enabled', false); // false (from defaultValue)
var enabled = r.get(input, 'model.enabled', true); // true (from defaultValue)
```

## API

### `need(object, path, [defaultValue])`
### `get(object, path, [defaultValue], [shouldLog])`

Gets the value at path of object. Uses Lodash's [get](https://lodash.com/docs#get) method. If the resolved value is `undefined `or if there is a type mismatch between the resolved value and default value, the `defaultValue` is returned in its place. If the `defaultValue` is an empty object, an object with an internal helper `__isEmpty` property is returned in its place. A type mismatch is determined with strict type checking that differentiates between `object`, `array`, and `null`. This is opposed to the native `typeof` which treats those identically as being type `object`.

`need()` assumes that the data of the specified type needs to be present. Otherwise, it will log.
`get()` is more lenient, and will only log if `shouldLog` resolves to truthy.

**Arguments**

- `object` (Object): The object to query.
- `path` (Array | String): The path of the property to get.
- `[defaultValue]` (*): The value returned for undefined resolved values. (defaults to '')
- `[shouldLog]` (Boolean): When this is truthy and used with `get()`, it will log as needed.

**Returns**

(*): Returns the resolved value.

### `has(object, path, [shouldLog])`

Checks if path is a direct property of object, and has a value that is not null or undefined.
This will log if the data is missing and `shouldLog` is truthy.

**Arguments**

- `object` (Object): The object to query.
- `path` (Array | String): The path of the check.
- `[shouldLog]` (Boolean): When this is truthy, it will log as needed.

**Returns**

*(boolean)*: Returns `true` if path exists, else `false`.

### `setLogger(logger)`

Sets the logger to be used for logging any issues in retrieving the data. If logging is desired, this should be called once at the start of the app to be used for all subsequent usage. If `retriever` logging is desired on the client, `setLogger` must be initialized in the browser as well. If you are using this with other logging libraries, you'll need to ensure that the logging is enabled per those environment settings.

**Arguments**

- `logger` (Function): A logger function that takes a single `message` parameter. For example, a type mismatch `message`, might look like this: `'event: typeMismatch, path: data.path[0], default: ''`

### `flush()`

This should be called when you want to end the log collection, and flush the data. This will make 2 calls to the supplied `logger` function. The first will contain aggregated statistics of the logs, while the second will contain the individual logs themselves.

## Similar Projects
- [Lodash get()](https://lodash.com/docs/#get)
- [Immutable.js getIn()](https://facebook.github.io/immutable-js/docs/#/Map/getIn)
- [object-path](https://github.com/mariocasciaro/object-path)
- [dot-prop](https://github.com/sindresorhus/dot-prop)
