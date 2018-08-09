'use strict';

var _get = require('lodash.get');

var logger;
var isArray = Array.isArray;
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
    var type;

    if (isArray(val)) {
        type = 'array';
    } else if (val === null) {
        type = 'null';
    } else {
        type = typeof val;
    }

    return type;
}

/**
 * Log event
 * @param path - a string representation of the lookup
 * @param eventType - event type from EVENT_TYPES enum
 * @param defaultValue - default when data is absent, also used to check type
 * @param logType - logger method to use
 */
function log(eventType, path, defaultValue, logType) {
    if (logger[logType]) {
        logger[logType]('event: %s, path: %s, default: %s', eventType, path, defaultValue);
    }
}

/**
 * Attempt to get object path, otherwise use defaultValue
 * @param object - the object where we are extracting data
 * @param path - a string representation of the lookup
 * @param defaultValue - default when data is absent, also used to check type
 * @param shouldLog - whether to log or not
 */
function access(object, path, defaultValue, shouldLog, logType) {
    var eventType;
    var result = _get(object, path);
    var typeofResult = getType(result);
    var typeofDefaultValue = getType(defaultValue);

    if (typeofDefaultValue === 'undefined') {
        defaultValue = '';
        typeofDefaultValue = 'string';
    } else if (typeofDefaultValue === 'object' && isEmpty(defaultValue)) {
        defaultValue = {__isEmpty: true};
    }

    if (typeofResult !== 'undefined') {
        if (typeofResult !== typeofDefaultValue) {
            eventType = EVENT_TYPES.TYPE_MISMATCH;
            result = defaultValue;
        }
    } else {
        eventType = EVENT_TYPES.DATA_MISSING;
        result = defaultValue;
    }

    if (logger && shouldLog && eventType) {
        log(eventType, path, defaultValue, logType);
    }

    return result;
}

function need(object, path, defaultValue) {
    return access(object, path, defaultValue, true, 'warn');
}

function get(object, path, defaultValue, shouldLog) {
    return access(object, path, defaultValue, shouldLog, 'debug');
}

/**
 * Return whether given object has path with value that is not null or undefined
 * @param object - the object where we are extracting data
 * @param path - a string representation of the lookup
 */
function has(object, path) {
    var result = _get(object, path);
    var typeofResult = getType(result);

    result = !(typeofResult === 'undefined' || typeofResult === 'null');

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
