/* eslint-disable max-len */

var chai = require('chai');
var sinon = require('sinon');
var r = require('../');

var expect = chai.expect;
var EVENT_TYPES = r.privates.EVENT_TYPES;
var basicObject = {
    a: {
        b: {
            c: 0,
            d: null,
            e: undefined,
            f: false
        }
    }
};
var objectWithArrays = {
    a: {
        b: [
            {
                c: 'test'
            }
        ]
    }
};
var nonEmptyObject = { a: 1 };
var defaultEmptyObject = { __isEmpty: true };
var emptyObjectWithPrototype = Object.create({ prototypeProperty: 1 });

['need', 'get'].forEach(function (accessor) {
    describe(accessor + '()', function () {
        it('gets simple value for basic object', function () {
            var value = r[accessor](basicObject, 'a.b.c', 1);
            expect(value).to.equal(0);
        });
        it('accesses array elements', function () {
            var value = r[accessor](objectWithArrays, 'a.b[0].c');
            expect(value).to.equal(objectWithArrays.a.b[0].c);
        });
        it('gets object value for basic object', function () {
            var value = r[accessor](basicObject, 'a.b', {});
            expect(value).to.deep.equal(basicObject.a.b);
        });
        it('uses default value under type mismatch', function () {
            var value = r[accessor](basicObject, 'a.b.c', '1');
            expect(value).to.equal('1');
        });
        it('uses default value when path doesn\'t exist', function () {
            var value = r[accessor](basicObject, 'a.b.d', 'default');
            expect(value).to.equal('default');
        });
        it('assumes default empty string when not passed in', function () {
            var value = r[accessor](basicObject, 'a.b.d');
            expect(value).to.equal('');
        });
        it('defaults to array when result is an object', function () {
            var value = r[accessor](basicObject, 'a.b', []);
            expect(value).to.deep.equal([]);
        });
        it('defaults to default object when result is null and default is a non-empty object', function () {
            var value = r[accessor](basicObject, 'a.b.d', nonEmptyObject);
            expect(value).to.deep.equal(nonEmptyObject);
        });
        it('defaults to internal empty object when result is null and default is an empty object', function () {
            var value = r[accessor](basicObject, 'a.b.d', {});
            expect(value).to.deep.equal(defaultEmptyObject);
        });
        it('defaults to internal empty object when result is null and default is empty object with prototype', function () {
            var value = r[accessor](basicObject, 'a.b.d', emptyObjectWithPrototype);
            expect(value).to.deep.equal(defaultEmptyObject);
        });
        it('defaults to defaultValue when result is undefined', function () {
            var value = r[accessor](basicObject, 'a.b.e', 'default');
            expect(value).to.deep.equal('default');
        });
    });
});

describe('has()', function () {
    it('checks existence of property in basic object', function () {
        var value = r.has(basicObject, 'a');
        expect(value).to.equal(true);
        value = r.has(basicObject, 'x');
        expect(value).to.equal(false);
    });
    it('checks existence of nested property in basic object', function () {
        var value = r.has(basicObject, 'a.b.c');
        expect(value).to.equal(true);
        value = r.has(basicObject, 'a.b.x');
        expect(value).to.equal(false);
    });
    it('returns false for key with null value', function () {
        var value = r.has(basicObject, 'a.b.d');
        expect(value).to.equal(false);
    });
    it('returns false for key with undefined value', function () {
        var value = r.has(basicObject, 'a.b.e');
        expect(value).to.equal(false);
    });
    it('returns true for key with false value', function () {
        var value = r.has(basicObject, 'a.b.f');
        expect(value).to.equal(true);
    });
    it('returns true for key with 0 value', function () {
        var value = r.has(basicObject, 'a.b.c');
        expect(value).to.equal(true);
    });
});

var scenarios = [
    { lookup: 'missingKey', event: EVENT_TYPES.DATA_MISSING },
    { lookup: 'a', event: EVENT_TYPES.TYPE_MISMATCH }
];

describe('logging', function () {
    ['need', 'get', 'has'].forEach(function (accessor) {
        scenarios.forEach(function (scenario) {
            var isHas = accessor === 'has';
            // skip typeMismatch scenario for has()
            if ((isHas && scenario.event === EVENT_TYPES.TYPE_MISMATCH)) {
                return;
            }

            describe(accessor + '(), event: ' + scenario.event, function () {
                var mockLogger;
                var shouldLog = accessor === 'get' ? true : undefined;

                beforeEach(function () {
                    mockLogger = sinon.spy();
                });

                it('logs through supplied logger', function () {
                    r.setLogger(mockLogger);
                    r[accessor](basicObject, scenario.lookup, isHas ? true : '', shouldLog);
                    r.flushLogs();
                    expect(mockLogger.callCount).to.equal(2);
                    var firstEventData = mockLogger.getCall(0).args[0];
                    var secondEventData = mockLogger.getCall(1).args[0];
                    expect(firstEventData).to.contain(scenario.event + ': 1');
                    expect(secondEventData).to.contain(scenario.event);
                });

                it('logs only stats when specified', function () {
                    r.setLogger(mockLogger);
                    r[accessor](basicObject, scenario.lookup, isHas ? true : '', shouldLog);
                    r.flushLogs(true);
                    expect(mockLogger.callCount).to.equal(1);
                    var firstEventData = mockLogger.getCall(0).args[0];
                    expect(firstEventData).to.contain(scenario.event + ': 1');
                });
            });
        });
    });
});

describe('not logging', function () {
    ['get', 'has'].forEach(function (accessor) {
        scenarios.forEach(function (scenario) {
            describe(accessor + '(), event: ' + scenario.event, function () {
                var mockLogger;

                beforeEach(function () {
                    mockLogger = sinon.spy();
                });

                it('does not log if logging was not started', function () {
                    r[accessor](basicObject, scenario.lookup, false, false);
                    expect(mockLogger.called).to.equal(false);
                });

                it('does not log if logger was not supplied', function () {
                    r.setLogger();
                    r[accessor](basicObject, scenario.lookup, false, false);
                    expect(mockLogger.called).to.equal(false);
                    r.flushLogs();
                });

                it('does not log through supplied logger', function () {
                    r.setLogger(mockLogger);
                    r[accessor](basicObject, scenario.lookup, false, false);
                    r.flushLogs();
                    expect(mockLogger.callCount).to.equal(0);
                });
            });
        });
    });
});
