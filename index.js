'use strict';

var _get = require('lodash.get');

var isArray = Array.isArray;
var EVENT_TYPES = {
    DATA_MISSING: 'dataMissing',
    TYPE_MISMATCH: 'typeMismatch'
};
var logger;
var logging = false;
var logs = [];
var stats = {};

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
function log(eventType, path, defaultValue) {
    logs.push('event: ' + eventType + ', path: ' + path + ', default: ' + defaultValue);
    stats[eventType]++;
}

/**
 * Attempt to get object path, otherwise use defaultValue
 * @param object - the object where we are extracting data
 * @param path - a string representation of the lookup
 * @param defaultValue - default when data is absent, also used to check type
 * @param logType - logger method to use
 */
function access(object, path, defaultValue, shouldWarn) {
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

    if (eventType && logging && shouldWarn) {
        log(eventType, path, defaultValue);
    }

    return result;
}

function need(object, path, defaultValue) {
    return access(object, path, defaultValue, true);
}

function get(object, path, defaultValue, shouldWarn) {
    return access(object, path, defaultValue, shouldWarn);
}

/**
 * Return whether given object has path with value that is not null or undefined
 * @param object - the object where we are extracting data
 * @param path - a string representation of the lookup
 */
function has(object, path, shouldWarn) {
    var result = _get(object, path);
    var typeofResult = getType(result);

    result = !(typeofResult === 'undefined' || typeofResult === 'null');

    if (!result && logging && shouldWarn) {
        log(EVENT_TYPES.DATA_MISSING, path, false);
    }

    return result;
}

/**
 * Set logger to be used for all future usage
 * @param object l - the logger with a warn function
 */
function startLogging(l) {
    if (l && l.warn) {
        logger = l;
        logging = true;
        logs = [];
        stats.dataMissing = 0;
        stats.typeMismatch = 0;
    }
}

function endLogging() {
    if (logger && logger.warn && logs.length) {
        logging = false;
        var dataMissing = stats.dataMissing;
        var typeMismatch = stats.typeMismatch;
        var total = dataMissing + typeMismatch;
        logger.warn('Warnings: ' + total + ', dataMissing: ' + dataMissing + ', typeMismatch: ' + typeMismatch);
        logger.warn(logs.join('\n'));
    }
}

module.exports = {
    need: need,
    get: get,
    has: has,
    startLogging: startLogging,
    endLogging: endLogging
};

module.exports.privates = {
    EVENT_TYPES: EVENT_TYPES
};
