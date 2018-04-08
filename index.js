var _get = require('lodash.get');

var isArray = Array.isArray;
var EVENT_TYPES = {
    DATA_MISSING: 'dataMissing',
    TYPE_MISMATCH: 'typeMismatch'
};
var logger;
var logs = [];
var stats = {};

/**
 * Determine if an object is empty
 * Copied from lodash.isEmpty, but optimized to only handle objects
 * @param {Object} obj - object to check
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
 * @param {*} val - value of which to check type
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
 * Attempt to get object path, otherwise use defaultValue
 * @param {Object} object - the object where we are extracting data
 * @param {String} path - a string representation of the lookup
 * @param {String} defaultValue - default when data is absent, also used to check type
 * @param {Boolean} shouldLog - must be truthy to log
 */
function access(object, path, defaultValue, shouldLog) {
    var eventType;
    var result = _get(object, path);
    var typeofResult = getType(result);
    var typeofDefaultValue = getType(defaultValue);

    if (typeofDefaultValue === 'undefined') {
        defaultValue = '';
        typeofDefaultValue = 'string';
    } else if (typeofDefaultValue === 'object' && isEmpty(defaultValue)) {
        defaultValue = { __isEmpty: true };
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

    if (eventType && logger && shouldLog) {
        log(eventType, path, defaultValue);
    }

    return result;
}

function need(object, path, defaultValue) {
    return access(object, path, defaultValue, true);
}

function get(object, path, defaultValue, shouldLog) {
    return access(object, path, defaultValue, shouldLog);
}

/**
 * Return whether given object has path with value that is not null or undefined
 * @param {Object} object - the object where we are extracting data
 * @param {String} path - a string representation of the lookup
 */
function has(object, path, shouldLog) {
    var result = _get(object, path);
    var typeofResult = getType(result);

    result = !(typeofResult === 'undefined' || typeofResult === 'null');

    if (!result && logger && shouldLog) {
        log(EVENT_TYPES.DATA_MISSING, path, false);
    }

    return result;
}

/**
 * Log event
 * @param {String} path - a string representation of the lookup
 * @param {String} eventType - event type from EVENT_TYPES enum
 * @param {*} defaultValue - default when data is absent, also used to check type
 */
function log(eventType, path, defaultValue) {
    logs.push('event: ' + eventType + ', path: ' + path + ', default: ' + defaultValue);
    stats[eventType]++;
}

/**
 * Set logger for all usage
 * @param {Function} l - the logger function
 */
function setLogger(l) {
    if (typeof l === 'function') {
        logger = l;
        resetLogs();
    }
}

/**
 * Flush current logs, and reset log storage
 * @param {Boolean} logStatsOnly - does not log individual logs when truthy
 */
function flushLogs(logStatsOnly) {
    if (typeof logger === 'function' && logs.length) {
        var dataMissing = stats.dataMissing;
        var typeMismatch = stats.typeMismatch;
        var total = dataMissing + typeMismatch;

        logger('Warnings: ' + total + ', dataMissing: ' + dataMissing + ', typeMismatch: ' + typeMismatch);

        if (!logStatsOnly) {
            logger(logs.join('\n'));
        }

        resetLogs();
    }
}

function resetLogs() {
    logs = [];
    stats = { dataMissing: 0, typeMismatch: 0 };
}

module.exports = {
    need: need,
    get: get,
    has: has,
    setLogger: setLogger,
    flushLogs: flushLogs
};

module.exports.privates = {
    EVENT_TYPES: EVENT_TYPES
};
