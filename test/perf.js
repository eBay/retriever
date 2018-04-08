'use strict';

var r = require('../');

r.startLogging({
    warn: function () {}
});

function buildPath(char, count) {
    return Array.apply(null, Array(count)).map(function (item, idx) {
        return char + (idx + 1);
    }).join('.');
}

// build paths object cache that corresponds to an obj
function buildPaths(breadth, depth, type) {
    var paths = {};
    for (var b = 0; b < breadth; b++) {
        var char = 'a' + b;
        for (var d = 1; d < depth; d++) {
            paths[char + d] = buildPath(char, d) + '.' + type;
        }
    }
    return paths;
}

// set up nested object with accessible values at each depth level
function buildObject(breadth, depth, type) {
    var typeValues = {
        string: 'string value',
        array: [0, 1, 2],
        object: {a: 1}
    };
    var obj = {};
    var count;
    var char;
    for (var b = 0; b < breadth; b++) {
        char = 'a' + b;
        obj[char + 1] = {};
        count = 1;
        for (var d = 0; d < depth; d++) {
            var working = r.get(obj, buildPath(char, count), {});
            working[type] = typeValues[type];
            working[char + (++count)] = {};
        }
    }
    return obj;
}

function retrieverLoop(accessor, breadth, depth, calls, obj, paths, defaultValue, useWrongPath) {
    var callsDone = 0;
    // keep repeating the breadth loop as necessary
    while (callsDone < calls) {
        // main loop where we try to access all obj paths
        breadthLoop:
        for (var b = 0; b < breadth; b++) {
            var char = 'a' + b;
            for (var d = 1; d < depth; d++) {
                var path = paths[char + d];
                if (useWrongPath) {
                    path += 'asdf'; // e.g. look for .stringasdf instead of .string
                }
                r[accessor](obj, path, defaultValue);

                // stop breadth loop early when we hit the calls number
                if (++callsDone >= calls) {
                    break breadthLoop;
                }
            }
        }
    }
}

var scenarios = [];
var defaults = {
    string: '',
    array: [],
    object: {}
};
var types = ['string', 'array', 'object'];

types.forEach(function (type) {
    scenarios.push({
        name: 'access ' + type,
        type: type,
        defaultValue: defaults[type],
        useWrongPath: false
    });
});

types.forEach(function (type) {
    scenarios.push({
        name: 'access ' + type + ' with wrong default',
        type: type,
        defaultValue: null, // takes advantage of `null` being its own type in retriever
        useWrongPath: false
    });
});

types.forEach(function (type) {
    scenarios.push({
        name: 'access ' + type + ' with wrong path',
        type: type,
        defaultValue: defaults[type],
        useWrongPath: true
    });
});

var objectVariations = [
    {breadth: 500, depth: 25},
    {breadth: 200, depth: 10},
    {breadth: 10, depth: 5}
];

['need', 'get'].forEach(function (accessor) {
    console.log('\n\n### ' + accessor + '() ###');
    scenarios.forEach(function (scenario) {
        console.log('\n' + scenario.name);
        objectVariations.forEach(function (objectVariation) {
            var calls = 5000;
            var breadth = objectVariation.breadth;
            var depth = objectVariation.depth;
            var type = scenario.type;
            var defaultValue = scenario.defaultValue;
            var useWrongPath = scenario.useWrongPath;
            var label = 'calls:' + calls + ', breadth:' + breadth + ', depth:' + depth;
            var obj = buildObject(breadth, depth, type);
            var paths = buildPaths(breadth, depth, type);

            console.time(label);
            retrieverLoop(accessor, breadth, depth, calls, obj, paths, defaultValue, useWrongPath);
            console.timeEnd(label);
        });
    });
});

r.endLogging();
process.exit();
