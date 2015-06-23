/*
	Promise测试用例
	2015-06-11 by 王炜毅

	注：跑此用例的浏览器需支持 {get x() {}}的语法，若不支持，请在跑之前注释相关用例（搜'get then()'）
 */

QUnit.module('new Promise(function(resolve, reject) { ... })');
QUnit.test('create a Promise object', function(assert) {
	var done = assert.async();
	try {
		new Promise();
	} catch(e) {
		assert.ok(e instanceof TypeError, 'executor must be a function');
		done();
	}

	var done2 = assert.async();
	try {
		new Promise(123);
	} catch(e) {
		assert.ok(e instanceof TypeError, 'executor must be a function');
		done2();
	}

	var done3 = assert.async();
	try {
		new Promise('xx');
	} catch(e) {
		assert.ok(e instanceof TypeError, 'executor must be a function');
		done3();
	}

	var done4 = assert.async();
	try {
		new Promise({});
	} catch(e) {
		assert.ok(e instanceof TypeError, 'executor must be a function');
		done4();
	}

	var done5 = assert.async();
	try {
		new Promise(/\d+/i);
	} catch(e) {
		assert.ok(e instanceof TypeError, 'executor must be a function');
		done5();
	}

	var done6 = assert.async();
	try {
		new Promise(function() {});
		assert.ok(true, 'executor must be a function');
		done6();

	} catch(e) {
	}
});
QUnit.test('reject promise', function(assert) {
	var done = assert.async();
	var p = new Promise(function(resolve, reject) {
		setTimeout(function() {
			reject(p);
		}, 200);
	});
	p.then(null, function(reason) {
		assert.equal(reason, p, 'reason refers to the same object as promise');
		done();
	});

	var done2 = assert.async();
	var x = {
		then: function(resolvePromise, rejectPromise) {
			resolvePromise(123);
		}
	};
	new Promise(function(resolve, reject) {
		reject(x);

	}).then(null, function(reason) {
		assert.equal(reason, x, 'reason is a thenable object');
		done2();
	});

	var done3 = assert.async();
	new Promise(function(resolve, reject) {
		
		reject(new Promise(function(resolve2) {
			resolve2(123);
		}));

	}).then(null, function(reason) {
		assert.ok(reason instanceof Promise, 'reason is a fulfilled promise');
		done3();
	});
});


QUnit.module('new Promise(function(resolve, reject) { ... }): resolve promise with x');
//这一点火狐没有按标准来（既不实现也不拒绝）
QUnit.test('x refers to the same object as promise', function(assert) {
	var done = assert.async();
	var p = new Promise(function(resolve, reject) {
		setTimeout(function() {
			resolve(p);
		}, 0);
	});
	p.then(null, function(reason) {
		assert.ok(reason instanceof TypeError, 'x refers to the same object as promise, throw exception');
		done();
	});
});
QUnit.test('x is a promise', function(assert) {
	var done = assert.async(), count = 0;
	var promise = new Promise(function(resolve, reject) {		
			resolve(new Promise(function(resolve2) {
				assert.equal(count, 0, 'when x is pending, promise must remain pending');		
					resolve2(888);
			}));
	});
	promise.then(function(value) {
		count++;
		assert.equal(value, 888, 'x is fulfilled, resolve promise with x.value');
	});
	promise.then(function(value) {
		count++;
		assert.equal(value, 888, 'x is fulfilled, resolve promise with x.value');
	});
	promise.then(function(value) {
		count++;
		assert.equal(value, 888, 'x is fulfilled, resolve promise with x.value');
		done();
	});

	var done2 = assert.async();
	var promise2 = new Promise(function(resolve, reject) {
		var p = new Promise(function(resolve2, reject2) {
			setTimeout(function() {
				reject2('error');
			}, 1000);
		});
		resolve(p);
	});
	promise2.then(null, function(reason) {
		assert.equal(reason, 'error', 'x is rejected, reject promise with x.reason');
	});
	promise2.then(null, function(reason) {
		assert.equal(reason, 'error', 'x is rejected, reject promise with x.reason');
		return 555;

	}).then(function(value) {
		assert.equal(value, 555, 'ok');
		done2();
	});

	var done3 = assert.async();
	var promise3 = new Promise(function(resolve, reject) {
		var p = new Promise(function(resolve2, reject2) {
			setTimeout(function() {
				reject2('error');
			}, 100);
		});
		var p2 = p.then(null, function(reason) {
			return 897; //p2 will be resolved with the value 897, and as 897 is primitive, p2 will be fulfilled.
		});
		resolve(p2);
	});
	promise3.then(function(value) {
		assert.equal(value, 897, 'ok');
		done3();
	});
});
QUnit.test('x is a thenable', function(assert) {
	var done = assert.async();
	new Promise(function(resolve, reject) {
		resolve({
			then: function(resolvePromise, rejectPromise) {
				resolvePromise(123);
			}
		});

	}).then(function(value) {
		assert.equal(value, 123, 'resolvePromise called with number, resolve promise with the number');
		done();
	});

	var done2 = assert.async();
	new Promise(function(resolve, reject) {
		resolve({
			then: function(resolvePromise, rejectPromise) {
				resolvePromise('string');
			}
		});

	}).then(function(value) {
		assert.equal(value, 'string', 'resolvePromise called with string, resolve promise with the string');
		done2();
	});

	var done3 = assert.async();
	new Promise(function(resolve, reject) {
		resolve({
			then: function(resolvePromise, rejectPromise) {
				resolvePromise();
			}
		});

	}).then(function(value) {
		assert.equal(value, undefined, 'resolvePromise called with undefined, resolve promise with undefined');
		done3();
	});

	var done4 = assert.async();
	new Promise(function(resolve, reject) {
		resolve({
			then: function(resolvePromise, rejectPromise) {
				resolvePromise({
					then: function(resolvePromise2, rejectPromise2) {
						resolvePromise2('haha');
					}
				});
			}
		});

	}).then(function(value) {
		assert.equal(value, 'haha', 'resolvePromise called with a thenable, resolve promise with the thenable');
		done4();
	});

	var done5 = assert.async();
	new Promise(function(resolve, reject) {
		resolve({
			then: function(resolvePromise, rejectPromise) {
				resolvePromise({
					then: function(resolvePromise2, rejectPromise2) {
						rejectPromise2(new Error('something wrong'));
					}
				});
			}
		});

	}).then(null, function(reason) {
		assert.ok(reason instanceof Error, 'resolvePromise called with a thenable, resolve promise with the thenable');
		done5();
	});

	var done6 = assert.async();
	new Promise(function(resolve, reject) {
		resolve({
			then: function(resolvePromise, rejectPromise) {
				rejectPromise({
					then: function(resolvePromise2, rejectPromise2) {
						rejectPromise2(new Error('something wrong'));
					}
				});
			}
		});

	}).then(null, function(reason) {
		assert.ok(reason.then instanceof Function, 'rejectPromise called with r, reject promise with r');
		done6();
	});

	var done7 = assert.async();
	new Promise(function(resolve, reject) {
		resolve({
			then: function(resolvePromise, rejectPromise) {
				resolvePromise('resolve promise');
				rejectPromise({
					then: function(resolvePromise2, rejectPromise2) {
						rejectPromise2(new Error('something wrong'));
					}
				});
			}
		});

	}).then(function(value) {
		assert.equal(value, 'resolve promise', 'both resolvePromise and rejectPromise are called, ignore rejectPromise');
		done7();
	});

	var done8 = assert.async();
	new Promise(function(resolve, reject) {
		resolve({
			then: function(resolvePromise, rejectPromise) {
				rejectPromise({
					then: function(resolvePromise2, rejectPromise2) {
						rejectPromise2(new Error('something wrong'));
					}
				});
				resolvePromise('resolve promise');
			}
		});

	}).then(null, function(reason) {
		assert.ok(reason.then instanceof Function, 'both rejectPromise and resolvePromise are called, ignore resolvePromise');
		done8();
	});

	var done9 = assert.async();
	new Promise(function(resolve, reject) {
		resolve({
			then: function(resolvePromise, rejectPromise) {
				resolvePromise('resolve promise');
				resolvePromise('resolve promise2');
				resolvePromise('resolve promise3');
			}
		});

	}).then(function(value) {
		assert.equal(value, 'resolve promise', 'resolvePromise are called 3 times, use the first');
		done9();
	});

	var done10 = assert.async();
	new Promise(function(resolve, reject) {
		resolve({
			then: function(resolvePromise, rejectPromise) {
				rejectPromise('error');
				rejectPromise('error2');
				rejectPromise('error3');
			}
		});

	}).then(null, function(reason) {
		assert.equal(reason, 'error', 'rejectPromise are called 3 times, use the first');
		done10();
	});

	var done11 = assert.async();
	new Promise(function(resolve, reject) {
		resolve({
			then: function(resolvePromise, rejectPromise) {
				throw 'exception';
			}
		});

	}).then(null, function(reason) {
		assert.equal(reason, 'exception', 'then throws a exception and neither resolvePromise nor rejectPromise has been called, reject promise with the exception');
		done11();
	});

	var done12 = assert.async();
	new Promise(function(resolve, reject) {
		resolve({
			then: function(resolvePromise, rejectPromise) {
				resolvePromise(333);
				throw 'exception';
			}
		});

	}).then(function(value) {
		assert.equal(value, 333, 'then throws a exception and resolvePromise has been called, ignore it');
		done12();
	});

	var done13 = assert.async();
	new Promise(function(resolve, reject) {
		resolve({
			then: function(resolvePromise, rejectPromise) {
				rejectPromise('error');
				throw 'exception';
			}
		});

	}).then(null, function(reason) {
		assert.equal(reason, 'error', 'then throws a exception and rejectPromise has been called, ignore it');
		done13();
	});

	var done14 = assert.async();
	new Promise(function(resolve, reject) {
		resolve({
			get then() {
				throw 'then cannot be accessed from outside!';
			}
		});

	}).then(null, function(reason) {
		assert.equal(reason, 'then cannot be accessed from outside!', 
			'retrieving the property x.then results in a thrown exception e, reject promise with e');
		done14();
	});
});
QUnit.test('x is neither a promise nor a thenable', function(assert) {
	var done = assert.async();
	new Promise(function(resolve, reject) {
		resolve(1.56);

	}).then(function(value) {
		assert.equal(value, 1.56, 'x is a number');
		done();
	});

	var done2 = assert.async();
	new Promise(function(resolve, reject) {
		resolve('hhah');

	}).then(function(value) {
		assert.equal(value, 'hhah', 'x is a string');
		done2();
	});

	var done3 = assert.async();
	new Promise(function(resolve, reject) {
		resolve();

	}).then(function(value) {
		assert.equal(value, undefined, 'x is undefined');
		done3();
	});

	var done4 = assert.async();
	new Promise(function(resolve, reject) {
		resolve(null);

	}).then(function(value) {
		assert.equal(value, null, 'x is null');
		done4();
	});

	var done5 = assert.async();
	new Promise(function(resolve, reject) {
		resolve({name: 'xiahua'});

	}).then(function(value) {
		assert.deepEqual(value, {name: 'xiahua'}, 'x is an object');
		done5();
	});

	var done6 = assert.async();
	var f = function() {};
	new Promise(function(resolve, reject) {
		resolve(f);

	}).then(function(value) {
		assert.equal(value, f, 'x is an function');
		done6();
	});
});

QUnit.module('then method');
QUnit.test('arugments', function(assert) {
	var ok = true;
	try {
		new Promise(function() {}).then();
	} catch(e) {
		console.log(e);
		ok = false;
	} finally {
		assert.ok(ok, 'no arugments provided, ok');
	}

	var ok2 = true;
	try {
		new Promise(function() {}).then(function() {});
	} catch(e) {
		ok2 = false;
	} finally {
		assert.ok(ok2, 'only onFulfilled is provided, ok');
	}

	var ok3 = true;
	try {
		new Promise(function() {}).then(null, function() {});
	} catch(e) {
		ok3 = false;
	} finally {
		assert.ok(ok3, 'only onRejected is provided, ok');
	}

	var ok4 = true, done4 = assert.async();
	try {		
		var p = new Promise(function(resolve) {
			resolve(2323);
		});
		setTimeout(function() {
			// p is already fulfilled now, so onFulfilled will get invoked immediately. 
			// as onFulfilled is not a function below, it should be ignored instead of invoking which will cause an error
			p.then(123);
		}, 100);

	} catch(e) {
		ok4 = false;

	} finally {
		assert.ok(ok4, 'onFulfilled should be function, otherwise it should be ignored.');
		done4();
	}

	var ok5 = true, done5 = assert.async();
	try {		
		var p = new Promise(function(resolve) {
			resolve(2323);
		});
		setTimeout(function() {
			// p is already fulfilled now, so onFulfilled will get invoked immediately. 
			// as onFulfilled is a function below, it should be invoked with the value of p
			p.then(function(value) {
				assert.equal(value, 2323, 'when promise is already fulfilled and onFulfilled is a function, it should get invoked immediately');
				done5();
			}); 
		}, 100);

	} catch(e) {
		ok5 = false;

	} finally {
		assert.ok(ok5, 'onFulfilled should be function, otherwise it should be ignored.');
	}

	var ok6 = true, done6 = assert.async();
	try {		
		var p2 = new Promise(function(resolve, reject) {
			reject('error');
		});
		setTimeout(function() {
			// p2 is already rejected now, so onRejected will get invoked immediately. 
			// as onRejected is not a function below, it should be ignored instead of invoking which will cause an error
			p2.then(null, 'haha'); 
			done6();
		}, 100);

	} catch(e) {
		ok6 = false;

	} finally {
		assert.ok(ok6, 'onRejected should be function, otherwise it should be ignored.');
	}

	var ok7 = true, done7 = assert.async();
	try {		
		var p3 = new Promise(function(resolve, reject) {
			reject('error');
		});
		setTimeout(function() {
			// p3 is already rejected now, so onRejected will get invoked immediately. 
			// as onRejected is a function below, it should be invoked with the reason of p3
			p3.then(null, function(reason) {
				assert.equal(reason, 'error', 'when promise is already rejected and onRejected is a function, it should get invoked immediately');
				done7();
			}); 
		}, 100);

	} catch(e) {
		ok7 = false;

	} finally {
		assert.ok(ok7, 'onRejected should be function, otherwise it should be ignored.');
	}
});
QUnit.test('return value', function(assert) {
	assert.ok( new Promise(function() {}).then() instanceof Promise, 'then must return a Promise');
});
QUnit.test('execution times', function(assert) {
	//fulfill promise
	var arr = [], done = assert.async();
	var p = new Promise(function(fulfill) {
		fulfill();
	});
	p.then(function() {
		arr.push('hello');
	});
	p.then(function() {
		arr.push(' world');
	});
	p.then(function() {
		arr.push('!');
		assert.equal(arr.length, 3, 'then can be called multiple times on the same promise');
		assert.equal(arr.join(''), 'hello world!', 'when promise is fulfilled, all respective onFulfilled callbacks must execute in the order of their originating calls to then')
		done();
	});

	// reject promise
	var arr2 = [], done2 = assert.async();
	var p2 = new Promise(function(fulfill, reject) {
		reject();
	});
	p2.then(null, function() {
		arr2.push('something');
	});
	p2.then(null, function() {
		arr2.push(' went');
	});
	p2.then(null, function() {
		arr2.push(' wrong');
		assert.equal(arr2.join(''), 'something went wrong', 'when promise is rejected, all respective onRejected callbacks must execute in the order of their originating calls to then')
		done2();
	});
});
QUnit.test('onFulfilled invocation', function(assert) {
	var count = 0, flag = false, i = 0;
	var done = assert.async();
	var p = new Promise(function(fulfill, reject) {
		fulfill(1);
		fulfill(2);
		fulfill(3);
	});

	while(i++ < 100000);
	flag = true;

	p.then(function(value) {
		count++;
		
		assert.ok(true, 'onFulfilled muse be called after promise is fulfilled');
		assert.equal(value, 1, 'onFulfilled must be called with the value of promise as its first argument');
		assert.equal(count, 1, 'noFulfilled must not be called more then once');
		assert.ok(flag, 'onFulfilled must not be called until the execution context stack contains only platform code');
		assert.equal(this, window, 'onFulfilled must be called as function. Non-strict-mode: this points to window');
		(function() {
			'use strict';
			assert.equal(this, undefined, 'onFulfilled must be called as function. Strict-mode: this is undefined');
		})();

		done();
	});

});
QUnit.test('onRejected invocation', function(assert) {
	var count = 0, flag = false, i = 0;
	var done = assert.async();
	var p = new Promise(function(fulfill, reject) {
		reject(1);
		reject(2);
		reject(3);
		reject(4);
	});

	while(i++ < 100000);
	flag = true;

	p.then(null, function(reason) {
		count++;
		
		assert.ok(true, 'onRejected muse be called after promise is rejected');
		assert.equal(reason, 1, 'onRejected must be called with the reason of promise as its first argument');
		assert.equal(count, 1, 'onRejected must not be called more then once');
		assert.ok(flag, 'onRejected must not be called until the execution context stack contains only platform code');
		assert.equal(this, window, 'onRejected must be called as function. Non-strict-mode: this points to window');
		(function() {
			'use strict';
			assert.equal(this, undefined, 'onRejected must be called as function. Strict-mode: this is undefined');
		})();
		
		done();
	});
});


QUnit.module('promise2=promise1.then(onFulfilled,onRejected)');
QUnit.test('onFulfilled throws an exception', function(assert) {
	var e, done = assert.async();
	new Promise(function(fulfill, reject) {
		fulfill(123);

	}).then(function(v) {
		e = new Error('exception occurs during onFulfilled of promise1');
		throw e;

	}).then(null, function(reason) {
		assert.equal(reason, e, 'promise2 must be rejected with e as the reason');
		done();
	});
});
QUnit.test('onRejected throws an exception', function(assert) {
	var e, done = assert.async();
	var promise2 = new Promise(function(fulfill, reject) {
		reject('something wrong');

	}).then(null, function(reason) {
		e = new Error('exception occurs during onRejected of promise1');
		throw e;

	}).then(null, function(reason) {
		assert.equal(reason, e, 'promise2 must be rejected with e as the reason');
		done();
	});
});
QUnit.test('onFulfilled is not a function and promise1 is fulfilled', function(assert) {
	var e, done = assert.async();
	var promise2 = new Promise(function(fulfill, reject) {
		fulfill(159);

	}).then().then(function(value) {
		assert.equal(value, 159, 'promise2 must be fulfilled with the same value as promise1');
		done();
	});
});
QUnit.test('onRejected is not a function and promise1 is rejected', function(assert) {
	var e, done = assert.async();
	var promise2 = new Promise(function(fulfill, reject) {
		reject('problem1');

	}).then().then(null, function(reason) {
		assert.equal(reason, 'problem1', 'promise2 must be rejected with the same reason as promise1');
		done();
	});
});


QUnit.module('promise2=promise1.then(onFulfilled,onRejected): onFulfilled returns a value x');
QUnit.test('promise2 and x refer to the same object', function(assert) {
	var promise1 = new Promise(function(fulfill) {
		fulfill();
	});
	var promise2 = promise1.then(function() {
		return promise2;
	});
	var done = assert.async();
	promise2.then(null, function(reason) {
		assert.ok(reason instanceof TypeError, 'reject promise2 with a TypeError as the reason')
		done();
	});
});
QUnit.test('x is a promise', function(assert) {
	var done = assert.async(), count = 0;
	var promise1 = new Promise(function(fulfill) {
		fulfill();
	});
	var promise2 = promise1.then(function() {
		return new Promise(function(innerFulfill) {
			setTimeout(function() {
				innerFulfill(123);
			}, 1000);
			assert.equal(count, 0, 'when x is pending, promise2 must remain pending until x is fulfilled or rejected.')
		});
	});
	promise2.then(function(value) {
		count++;
		assert.equal(value, 123, 'when x is fulfilled, fulfill promise with the same value');
	});
	promise2.then(function(value) {
		count++;
		assert.equal(value, 123, 'when x is fulfilled, fulfill promise with the same value');
	});
	promise2.then(function(value) {
		count++;
		assert.equal(value, 123, 'when x is fulfilled, fulfill promise with the same value');
		done();
	});

	var done2 = assert.async(),  count2 = 0;
	var promise3 = new Promise(function(fulfill) {
		fulfill();
	});
	var promise4 = promise3.then(function() {
		return new Promise(function(innerFulfill, innerReject) {
			setTimeout(function() {
				innerReject('error occurs');
			}, 1000);
			assert.equal(count2, 0, 'when x is pending, promise2 must remain pending until x is fulfilled or rejected.')
		});
	});
	promise4.then(null, function(reason) {
		count2++;
		assert.equal(reason, 'error occurs', 'when x is rejected, reject promise with the same reason')
	});
	promise4.then(null, function(reason) {
		count2++;
		assert.equal(reason, 'error occurs', 'when x is rejected, reject promise with the same reason')
		done2();
	});
});
QUnit.test('x is a thenable', function(assert) {
	var done = assert.async();
	new Promise(function(resolve) {
		resolve();

	}).then(function() {
		return {
			then: function(resolvePromise, rejectPromise) {
				resolvePromise(123);
			}
		};
	}).then(function(value) {
		assert.equal(value, 123, 'resolvePromise called with a number, resolve promise2 with the number');
		done();
	});

	var done2 = assert.async();
	new Promise(function(resolve) {
		resolve();

	}).then(function() {
		return {
			then: function(resolvePromise, rejectPromise) {
				resolvePromise('string');
			}
		};

	}).then(function(value) {
		assert.equal(value, 'string', 'resolvePromise called with string, resolve promise2 with the string');
		done2();
	});

	var done3 = assert.async();
	new Promise(function(resolve) {
		resolve();

	}).then(function() {
		return {
			then: function(resolvePromise, rejectPromise) {
				resolvePromise();
			}
		};

	}).then(function(value) {
		assert.equal(value, undefined, 'resolvePromise called with undefined, resolve promise2 with undefined');
		done3();
	});

	var done4 = assert.async();
	new Promise(function(resolve) {
		resolve();

	}).then(function() {
		return {
			then: function(resolvePromise, rejectPromise) {
				resolvePromise({
					then: function(resolvePromise2, rejectPromise2) {
						resolvePromise2('haha');
					}
				});
			}
		};

	}).then(function(value) {
		assert.equal(value, 'haha', 'resolvePromise called with a thenable, resolve promise2 with the thenable');
		done4();
	});

	var done5 = assert.async();
	new Promise(function(resolve) {
		resolve();

	}).then(function() {
		return {
			then: function(resolvePromise, rejectPromise) {
				resolvePromise({
					then: function(resolvePromise2, rejectPromise2) {
						rejectPromise2(new Error('something wrong'));
					}
				});
			}
		};

	}).then(null, function(reason) {
		assert.ok(reason instanceof Error, 'resolvePromise called with a thenable, resolve promise2 with the thenable');
		done5();
	});

	var done6 = assert.async();
	new Promise(function(resolve) {
		resolve();

	}).then(function() {
		return {
			then: function(resolvePromise, rejectPromise) {
				rejectPromise({
					then: function(resolvePromise2, rejectPromise2) {
						rejectPromise2(new Error('something wrong'));
					}
				});
			}
		};

	}).then(null, function(reason) {
		assert.ok(reason.then instanceof Function, 'rejectPromise called with r, reject promise with r');
		done6();
	});

	var done7 = assert.async();
	new Promise(function(resolve) {
		resolve();

	}).then(function() {
		return {
			then: function(resolvePromise, rejectPromise) {
				resolvePromise('resolve promise');
				rejectPromise({
					then: function(resolvePromise2, rejectPromise2) {
						rejectPromise2(new Error('something wrong'));
					}
				});
			}
		};

	}).then(function(value) {
		assert.equal(value, 'resolve promise', 'both resolvePromise and rejectPromise are called, ignore rejectPromise');
		done7();
	});

	var done8 = assert.async();
	new Promise(function(resolve) {
		resolve();

	}).then(function() {
		return {
			then: function(resolvePromise, rejectPromise) {
				rejectPromise({
					then: function(resolvePromise2, rejectPromise2) {
						rejectPromise2(new Error('something wrong'));
					}
				});
				resolvePromise('resolve promise');
			}
		};

	}).then(null, function(reason) {
		assert.ok(reason.then instanceof Function, 'both rejectPromise and resolvePromise are called, ignore resolvePromise');
		done8();
	});

	var done9 = assert.async();
	new Promise(function(resolve) {
		resolve();

	}).then(function() {
		return {
			then: function(resolvePromise, rejectPromise) {
				resolvePromise('resolve promise');
				resolvePromise('resolve promise2');
				resolvePromise('resolve promise3');
			}
		};

	}).then(function(value) {
		assert.equal(value, 'resolve promise', 'resolvePromise are called 3 times, use the first');
		done9();
	});

	var done10 = assert.async();
	new Promise(function(resolve) {
		resolve();

	}).then(function() {
		return {
			then: function(resolvePromise, rejectPromise) {
				rejectPromise('error');
				rejectPromise('error2');
				rejectPromise('error3');
			}
		};

	}).then(null, function(reason) {
		assert.equal(reason, 'error', 'rejectPromise are called 3 times, use the first');
		done10();
	});

	var done11 = assert.async();
	new Promise(function(resolve) {
		resolve();

	}).then(function() {
		return {
			then: function(resolvePromise, rejectPromise) {
				throw 'exception';
			}
		};

	}).then(null, function(reason) {
		assert.equal(reason, 'exception', 'then throws a exception and neither resolvePromise nor rejectPromise has been called, reject promise with the exception');
		done11();
	});

	var done12 = assert.async();
	new Promise(function(resolve) {
		resolve();

	}).then(function() {
		return {
			then: function(resolvePromise, rejectPromise) {
				resolvePromise(333);
				throw 'exception';
			}
		};

	}).then(function(value) {
		assert.equal(value, 333, 'then throws a exception and resolvePromise has been called, ignore it');
		done12();
	});

	var done13 = assert.async();
	new Promise(function(resolve) {
		resolve();

	}).then(function() {
		return {
			then: function(resolvePromise, rejectPromise) {
				rejectPromise('error');
				throw 'exception';
			}
		};

	}).then(null, function(reason) {
		assert.equal(reason, 'error', 'then throws a exception and rejectPromise has been called, ignore it');
		done13();
	});

	var done14 = assert.async();
	new Promise(function(resolve) {
		resolve();

	}).then(function() {
		return {
			get then() {
				throw 'then cannot be accessed from outside!';
			}
		};

	}).then(null, function(reason) {
		assert.equal(reason, 'then cannot be accessed from outside!', 
			'retrieving the property x.then results in a thrown exception e, reject promise with e');
		done14();
	});
});
QUnit.test('x is neither a promise nor a thenable', function(assert) {
	var done = assert.async();
	new Promise(function(resolve, reject) {
		resolve();
		
	}).then(function() {
		return 1.56;

	}).then(function(value) {
		assert.equal(value, 1.56, 'x is a number');
		done();
	});

	var done2 = assert.async();
	new Promise(function(resolve, reject) {
		resolve();
		
	}).then(function() {
		return 'hhah';

	}).then(function(value) {
		assert.equal(value, 'hhah', 'x is a string');
		done2();
	});

	var done3 = assert.async();
	new Promise(function(resolve, reject) {
		resolve();
		
	}).then(function() {
		return;

	}).then(function(value) {
		assert.equal(value, undefined, 'x is undefined');
		done3();
	});

	var done4 = assert.async();
	new Promise(function(resolve, reject) {
		resolve();
		
	}).then(function() {
		return null;

	}).then(function(value) {
		assert.equal(value, null, 'x is null');
		done4();
	});

	var done5 = assert.async();
	new Promise(function(resolve, reject) {
		resolve();
		
	}).then(function() {
		return {name: 'xiahua'};

	}).then(function(value) {
		assert.deepEqual(value, {name: 'xiahua'}, 'x is an object');
		done5();
	});

	var done6 = assert.async();
	var f = function() {};
	new Promise(function(resolve, reject) {
		resolve();
		
	}).then(function() {
		return f;

	}).then(function(value) {
		assert.equal(value, f, 'x is an function');
		done6();
	});

	var done7 = assert.async();
	var o = {
		count: 0,
		get then() {
			return ++o.count;
		}
	};
	new Promise(function(resolve, reject) {
		resolve();
		
	}).then(function() {
		return o;

	}).then(function(value) {
		assert.equal(value.count, 1, 'if x is an object or function, let then be x.then, avoiding change between retrievals');
		done7();
	});
});


QUnit.module('dead lock');
QUnit.test('resolve promise with a thenable that participates in a circular thenable chain', function(assert) {
	var done = assert.async();
	var p, p2;
	p2 = new Promise(function(resolve, reject) {
		setTimeout(function() {
			resolve(p);
		});
	});
	p = new Promise(function(resolve, reject) {
		resolve(p2);
	});
	p.then(null, function(reason) {
		assert.ok(reason instanceof TypeError, 'p-->p2-->p, reject p with a informative TypeError');		
		done();
	});

	var done2 = assert.async();
	var p3, p4, p5;
	p3 = new Promise(function(resolve, reject) {
		setTimeout(function() {
			resolve(p5);
		});
	});
	p4 = new Promise(function(resolve, reject) {
		resolve(p3);

	});
	p5 = p.then(null, function(reason) {
		assert.ok(reason instanceof TypeError, 'p(p3-->p.then)-->p2-->p3, reject p with a informative TypeError');
		done2();
	});

	var done3 = assert.async();
	new Promise(function(resolve) {
		resolve();

	}).then(function() {
		var o = {
			then: function(resolvePromise) {
				resolvePromise(o);
			}
		};
		return o;

	}).then(null, function(reason) {
		assert.ok(reason instanceof TypeError, 'p-->x(resolvePromise(x)), reject p with a informative TypeError');
		done3();
	});
});


QUnit.module('Promise.all');
QUnit.test('argument', function(assert) {
	var done = assert.async();
	try {
		var p = new Promise(function(resolve) {
			resolve(1);
		});
		Promise.all(p);
	} catch(e) {
		assert.ok(e instanceof TypeError, 'argument is not an array, throw TypeError exception');
		done();
	}

	var done2 = assert.async();
	try {
		var p = new Promise(function(resolve) {
			resolve(1);
		});
		Promise.all([p, 'haha']);
	} catch(e) {
		assert.ok(e instanceof TypeError, 'argument is an array, but not all elements are promise, throw TypeError');
		done2();
	}

	var done3 = assert.async(), ok = true;
	try {
		Promise.all([]);
	} catch(e) {
		assert.ok(e instanceof TypeError, 'argument is an empty array, throw TypeError');
		done3();
	}

	var done4 = assert.async();
	var p1 = new Promise(function(resolve) {
		resolve(1);
	});
	var p2 = new Promise(function(resolve) {
		resolve(2);
	});
	var p3 = new Promise(function(resolve) {
		resolve(3);
	});
	Promise.all([p1, p2, p3]);
	assert.ok(true, 'argument is an promise array, passed.');
	done4();
});
QUnit.test('resolve', function(assert) {
	var done = assert.async();
	var p1 = new Promise(function(resolve) {
		resolve(1);
	});
	var p2 = new Promise(function(resolve) {
		resolve(2);
	});
	var p3 = new Promise(function(resolve) {
		resolve(3);
	});
	Promise.all([p1, p2, p3]).then(function(value) {
		assert.equal(value.length, 3, 'value is an array');
		assert.deepEqual(value, [1, 2, 3], 'with the same sequence to the promise array');
		done();
	});

	var done2 = assert.async();
	var p4 = new Promise(function(resolve) {
		setTimeout(function() {
			resolve(1);
		}, 200);
	});
	var p5 = new Promise(function(resolve) {
		setTimeout(function() {
			resolve(2);
		}, 300);
	});
	var p6 = new Promise(function(resolve) {
		setTimeout(function() {
			resolve(3);
		}, 500);
	});
	var start = +new Date();
	Promise.all([p4, p5, p6]).then(function(value) {
		assert.ok(+new Date() - start >= 500, 'promise must be resolve after all the precedent promises resolved');
		done2();
	});
});
QUnit.test('reject', function(assert) {
	var done2 = assert.async();
	var p4 = new Promise(function(resolve, reject) {
		setTimeout(function() {
			reject('error1');
		}, 200);
	});
	var p5 = new Promise(function(resolve, reject) {
		setTimeout(function() {
			reject('error2');
		}, 300);
	});
	var p6 = new Promise(function(resolve, reject) {
		setTimeout(function() {
			reject('error3');
		}, 500);
	});
	Promise.all([p4, p5, p6]).then(null, function(reason) {
		assert.ok(reason === 'error1', 'promise must be reject as soon as any promise being rejected');
		done2();
	});
});


QUnit.module('Promise.race');
QUnit.test('argument', function(assert) {
	var done = assert.async();
	try {
		var p = new Promise(function(resolve) {
			resolve(1);
		});
		Promise.race(p);
	} catch(e) {
		assert.ok(e instanceof TypeError, 'argument is not an array, throw TypeError exception');
		done();
	}

	var done2 = assert.async();
	try {
		var p = new Promise(function(resolve) {
			resolve(1);
		});
		Promise.race([p, 'haha']);
	} catch(e) {
		assert.ok(e instanceof TypeError, 'argument is an array, but not all elements are promise, throw TypeError');
		done2();
	}

	var done3 = assert.async(), ok = true;
	try {
		Promise.race([]);
	} catch(e) {
		assert.ok(e instanceof TypeError, 'argument is an empty array, throw TypeError');
		done3();
	}

	var done4 = assert.async();
	var p1 = new Promise(function(resolve) {
		resolve(1);
	});
	var p2 = new Promise(function(resolve) {
		resolve(2);
	});
	var p3 = new Promise(function(resolve) {
		resolve(3);
	});
	Promise.race([p1, p2, p3]);
	assert.ok(true, 'argument is an promise array, passed.');
	done4();
});
QUnit.test('resolve', function(assert) {
	var done = assert.async();
	var p1 = new Promise(function(resolve) {
		resolve(1);
	});
	var p2 = new Promise(function(resolve) {
		resolve(2);
	});
	var p3 = new Promise(function(resolve) {
		resolve(3);
	});
	Promise.race([p1, p2, p3]).then(function(value) {
		assert.ok(value === 1 || value === 2 || value === 3, 'value is the value of the promise which get resolved first');
		done();
	});

	var done2 = assert.async();
	var p4 = new Promise(function(resolve) {
		setTimeout(function() {
			resolve(1);
		}, 200);
	});
	var p5 = new Promise(function(resolve) {
		setTimeout(function() {
			resolve(2);
		}, 500);
	});
	var start = +new Date();
	Promise.race([p4, p5]).then(function(value) {
		var delta = +new Date() - start;
		assert.ok(delta <= 500 && value === 1, 'promise is resolved once one of the precedent promises get resolved');
		done2();
	});
});
QUnit.test('reject', function(assert) {
	var done = assert.async();
	var p1 = new Promise(function(resolve, reject) {
		reject('error1');
	});
	var p2 = new Promise(function(resolve, reject) {
		reject('error2');
	});
	var p3 = new Promise(function(resolve, reject) {
		reject('error3');
	});
	Promise.race([p1, p2, p3]).then(null, function(reason) {
		assert.ok(reason === 'error1' || reason === 'error2' || reason === 'error3', 'reason is the reason of the promise which get rejected first');
		done();
	});

	var done2 = assert.async();
	var p4 = new Promise(function(resolve, reject) {
		setTimeout(function() {
			reject('error1');
		}, 200);
	});
	var p5 = new Promise(function(resolve, reject) {
		setTimeout(function() {
			reject('error2');
		}, 2000);
	});
	var p6 = new Promise(function(resolve, reject) {
		setTimeout(function() {
			reject('error3');
		}, 5000);
	});
	var start = +new Date();
	Promise.race([p4, p5, p6]).then(null, function(reason) {
		var delta = +new Date() - start;
		assert.ok(delta > 200 && delta < 2000 && reason === 'error1', 'promise is rejected once one of the precedent promises get rejected');
		done2();
	});
});