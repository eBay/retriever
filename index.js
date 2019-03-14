'use strict';

var logger;
var EVENT_TYPES = {
    DATA_MISSING: 'dataMissing',
    TYPE_MISMATCH: 'typeMismatch'
};

/**
 * Determine if an object is empty
 * Copied from lodash.isEmpty, but optimized to only handle objects
 * @param obj - object to check
 */
function isEmpty(obj) {
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) {
            return false;
        }
    }
    return true;
}

/**
 * Get `typeof`, but with stricter checking for array and null
 * @param val - value of which to check type
 */
function getType(val) {
    return toString.call(val).slice(8, -1);
}

/**
 * Log event
 * @param path - a string representation of the lookup
 * @param eventType - event type from EVENT_TYPES enum
 * @param defaultResult - default when data is absent, also used to check type
 * @param logType - logger method to use
 */
function log(eventType, path, defaultResult, logType) {
    if (logger[logType]) {
        logger[logType]('event: %s, path: %s, default: %s', eventType, path, defaultResult);
    }
}

/**
 * Attempt to get object path
 * @param obj - the object where we are extracting data
 * @param path - a string representation of the lookup
 */
function getResult(obj, path) {
    var lastIndex = 0;
    var index;
    var len = path.length;
    var cur = obj;

    // transform array syntax to use dot delimeters for easier parsing
    if (path.indexOf('[') !== -1) {
        path = path.replace(/\[/g, '.').replace(/\]/g, '');
    }

    do {
        if (cur == null) { // eslint-disable-line eqeqeq
            return;
        }

        index = path.indexOf('.', lastIndex);
        if (index === -1) {
            index = len;
        }

        cur = cur[path.slice(lastIndex, index)];
        lastIndex = index + 1;
    } while (lastIndex < len);

    return cur;
}

/**
 * Attempt to get object path, otherwise use defaultResult
 * @param obj - the object where we are extracting data
 * @param path - a string representation of the lookup
 * @param defaultResult - default when data is absent, also used to check type
 * @param logType - logger method to use
 */
function access(obj, path, defaultResult, logType) {
    var eventType;
    var result = getResult(obj, path);

    var typeofResult = getType(result);
    var typeofDefaultResult = getType(defaultResult);

    if (typeofDefaultResult === 'Undefined') {
        defaultResult = '';
        typeofDefaultResult = 'String';
    } else if (typeofDefaultResult === 'Object' && isEmpty(defaultResult)) {
        defaultResult = {__isEmpty: true};
    }

    if (typeofResult !== 'Undefined') {
        if (typeofResult !== typeofDefaultResult) {
            eventType = EVENT_TYPES.TYPE_MISMATCH;
            result = defaultResult;
        }
    } else {
        eventType = EVENT_TYPES.DATA_MISSING;
        result = defaultResult;
    }

    if (logger && logType && eventType) {
        log(eventType, path, defaultResult, logType);
    }

    return result;
}

function need(obj, path, defaultResult) {
    return access(obj, path, defaultResult, 'warn');
}

function get(obj, path, defaultResult) {
    return access(obj, path, defaultResult);
}

/**
 * Return whether given object has path with value that is not null or undefined
 * @param obj - the object where we are extracting data
 * @param path - a string representation of the lookup
 */
function has(obj, path) {
    var result = getResult(obj, path);
    var typeofResult = getType(result);

    result = !(typeofResult === 'Undefined' || typeofResult === 'Null');

    return result;
}

/**
 * Set logger to be used for all future usage
 * @param object l - the logger with a warn function
 */
function setLogger(l) {
    logger = l;
}

module.exports = {
    need: need,
    get: get,
    has: has,
    setLogger: setLogger
};

module.exports.privates = {
    EVENT_TYPES: EVENT_TYPES
};
