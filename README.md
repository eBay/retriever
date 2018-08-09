# retriever

`retriever` is a small utility library for retrieving nested data safely. It contains several improvements over solutions like `lodash.get`, such as:
- **Type checking**: Ensure that accessed data is of the exact type that is needed.
- **Optional logging**: Log warnings in cases of required data that is missing or of the wrong type.
- **Convenient defaults**: Retrieving data looks for strings by default, and also provides extra utility for objects.

## Installation

If you're using `yarn`:
```sh
yarn add @ebay/retriever
```
or if you're using `npm`:
```sh
npm install @ebay/retriever --save
```

## Usage

```js
var r = require('@ebay/retriever');

// set optional logger for missing data or type mismatch with defaultValue
r.setLogger({
    debug: function (messageFormat, eventType, lookupPath, defaultValue) {}, // used with get()
    warn: function (messageFormat, eventType, lookupPath, defaultValue) {} // used with need()
});

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
var count = r.need(input, 'model.count', '50'); // '50' (from defaultValue), logs `warning`
var count = r.get(input, 'model.count', '50'); // '50' (from defaultValue), does not log
var count = r.get(input, 'model.count', '50', true); // '50' (from defaultValue), logs `debug`

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
var enabled = r.get(input, 'model.enabled', false, true); // false (from defaultValue) but logs
var enabled = r.get(input, 'model.enabled', true), true; // true (from defaultValue) but logs
```

## API

### `need(object, path, [defaultValue])`
### `get(object, path, [defaultValue], shouldLog)`

Gets the value at path of object. Uses Lodash's [get](https://lodash.com/docs#get) method. If the resolved value is `undefined `or if there is a type mismatch between the resolved value and default value, the `defaultValue` is returned in its place. If the `defaultValue` is an empty object, an object with an internal helper `__isEmpty` property is returned in its place. A type mismatch is determined with strict type checking that differentiates between `object`, `array`, and `null`. This is opposed to the native `typeof` which treats those identically as being type `object`.

`need()` assumes that the data of the specified type needs to be present. Otherwise, it will log a warning.
`get()` is more lenient, and will log `debug` when the `shouldLog` argument is `true`.

**Arguments**

- `object` (Object): The object to query.
- `path` (Array | String): The path of the property to get.
- `[defaultValue]` (*): The value returned for undefined resolved values. (defaults to '')
- `shouldLog` (boolean): `get()` logs `debug` when set to `true`

**Returns**

(*): Returns the resolved value.

### `has(object, path)`

Checks if path is a direct property of object, and has a value that is not null or undefined.

**Arguments**

- `object` (Object): The object to query.
- `path` (Array | String): The path of the check.

**Returns**

*(boolean)*: Returns `true` if path exists, else `false`.

### `setLogger(logger)`

Sets the logger to be used for logging any issues in retrieving the data. If logging is desired, this should be called once at the start of the app to be used for all subsequent usage. If `retriever` logging is desired on the client, `setLogger` must be initialized in the browser as well. If you are using this with other logging libraries, you'll need to ensure that the logging is enabled per those environment settings.

**Arguments**

- `logger` (Object): A logger object containing the functions `debug` and `warn`. These functions will be called with the following parameters:
`messageFormat`, `eventType`, `lookupPath`, `defaultValue`.

For example, a type mismatch warning, the parameters might look like this:
- `messageFormat`: `'event: %s, path: %s, default: %s'`
- `eventType`: `'typeMismatch'`
- `lookupPath`: `'data.path[0]'`
- `default`: `''`

## Similar Projects
- [Lodash get()](https://lodash.com/docs/#get)
- [Immutable.js getIn()](https://facebook.github.io/immutable-js/docs/#/Map/getIn)
- [object-path](https://github.com/mariocasciaro/object-path)
- [dot-prop](https://github.com/sindresorhus/dot-prop)
