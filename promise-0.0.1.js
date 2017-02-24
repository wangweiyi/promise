/**
 * @file Promise实现
 * @author WangWeiyi
 * @version 1.0
 */

(function () {
	'use strict';
	// TODO: 这里可以设置一个开关，若传了则使用原生的，但这必须要作为模块调用
	// TODO: 将Promise设计成可AMD 可CMD 可非模块引的形式

	//因FF及Chrome都没有处理相互解决的死锁情况，故舍弃浏览器的原生实现
	// if(window.Promise && typeof window.Promise.then === 'function') return;

	/**
	 * 构造方法
	 * @global
	 * @constructor 
	 * @param {function} task 一个函数，用于指定Promise要执行的任务
	 */
	function Promise(task, internal) {
		if (internal !== true && !isFunc(task)) {
			throw new TypeError('task must be a function');
		}

		this._state = 'pending';
		this._value = undefined;
		this._reason = undefined;
		this._onFulfilledArr = [];
		this._onRejectedArr = [];
		// this._next = []; //promise chain
		this._nextArr = [];

		if (isFunc(task)) {
			var promise = this,
				count = 0,
				delay = function (callback) {
					if (count) {
						return;
					}
					count++;
					setTimeout(callback, 0);
				};

			task(function (value) {
				delay(function () {
					resolve(promise, value);
				});

			}, function (reason) {
				delay(function () {
					reject(promise, reason);
				});
			});
		}
	}

	/**
	 * 	接受一个Promise数组作为参数， 返回一个新的promise：<br/>
	 * 		当Promise数组中所有的promise都被解决后，该promise以所有promise的结果集（一个数组，顺序与promise一一对应）作为结果被解决<br/>
	 *   	当Promise数组中任一promise被拒绝时，该promise以相同的原因被拒绝
	 *
	 * @memberOf Promise
	 * @param  {Array} promiseArr 等待执行的promise队列
	 * @return {Promise} 一个新的promise对象
	 */
	Promise.all = function (promiseArr) {
		if (!isPromiseArray(promiseArr)) {
			throw new TypeError('parameter must be an promise array!');
		}

		var promise = new Promise(null, true),
			valueCount = 0,
			valueArr = [],
			addCallback = function (i) { //提成函数是为了保持i值的一致性
				promiseArr[i].then(function (value) {
					valueCount++;
					valueArr[i] = value;

					if (valueCount === len) {
						resolve(promise, valueArr);
					}

					//保证原onFulfilled链的行为不被破坏.
					//即：当原onFulfilledArr为空而原promise被解决时，原promise的nextPromise能正确地以value被解决
					return value;

				}, function (reason) {
					reject(promise, reason);

					//保证原onRejected链的行为不被破坏.
					//即：当原onRejectedArr为空而原promise被拒绝时，原promise的nextPromise能正确地以reason被拒绝
					return reason;
				});
			};

		for (var i = 0, len = promiseArr.length; i < len; i++) {
			addCallback(i);
		}

		return promise;
	};

	/**
	 * 	接受一个Promise数组作为参数， 返
	 * 	回一个新的promise：<br/>
	 * 		当Promise数组中任一promise被解决后，该promise以相同的结果被解决<br/>
	 *   	当Promise数组中任一promise被拒绝时，该promise以相同的原因被拒绝
	 *
	 * @memberOf Promise
	 * @param  {Array} promiseArr 等待执行的promise队列
	 * @return {Promise} 一个新的promise对象
	 */
	Promise.race = function (promiseArr) {
		if (!isPromiseArray(promiseArr)) {
			throw new TypeError('parameter must be an promise array!');
		}

		var promise = new Promise(null, true);
		for (var i = 0, len = promiseArr.length; i < len; i++) {
			promiseArr[i].then(function (value) {
				resolve(promise, value);
				return value; //原因参见Promise.all

			}, function (reason) {
				reject(promise, reason);
				return reason; //原因参见Promise.all
			});
		}
		return promise;
	};

	/**
	 * 返回一个被解决的Promise对象，值通过参数指定。当参数为thenable时，接受其状态; 否则，以参数完成promise.
	 *
	 * @memberOf Promise
	 * @param  {Array} promiseArr 等待执行的promise队列
	 * @return {Promise} 一个新的promise对象
	 */
	Promise.resolve = function (value) {
		var promise = new Promise(null, true);
		resolve(promise, value);
		return promise;
	};

	/**
	 * 返回一个已经被拒绝了的Promise对象，原因由参数指定。
	 *
	 * @memberOf Promise
	 * @param  {Any} reason Promise的拒因
	 * @return {Promise} 一个以reason为因被拒绝的Promise对象
	 */
	Promise.reject = function (reason) {
		var promise = new Promise(null, true);
		reject(promise, reason);
		return promise;
	};

	Promise.prototype = {
		constructor: Promise,

		/**
		 * 为promise添加完成及拒绝回调, 返回一个新的promis
		 * 
		 * @memberOf Promise#
		 * @param  {function} onFulfilled 完成回调，接受一个参数，参数值为Promise的结果
		 * @param  {function} onRejected 拒绝回调, 接受一个参数，参数值为Promise的拒因
		 * @return {Promise}  一个新的Promise对象
		 */
		then: function (onFulfilled, onRejected) {
			var isOnFulfilledFunc = isFunc(onFulfilled),
				isOnRejectedFunc = isFunc(onRejected);

			if (isOnFulfilledFunc) {
				this._onFulfilledArr.push(onFulfilled);
			} else {
				this._onFulfilledArr.push(null);
			}

			if (isOnRejectedFunc) {
				this._onRejectedArr.push(onRejected);
			} else {
				this._onRejectedArr.push(null);
			}

			if (this._state === 'fulfilled') {
				isOnFulfilledFunc && onFulfilled(this._value);

			} else if (this._state === 'rejected') {
				isOnRejectedFunc && onRejected(this._reason);
			}

			var next = new Promise(null, true);
			this._nextArr.push(next)
			return next;
		},

		/**
		 * 为promise添加拒绝回调, 返回一个新的promis
		 * 
		 * @memberOf Promise#
		 * @param  {function} onRejected 拒绝回调, 接受一个参数，参数值为Promise的拒因
		 * @return {Promise}  一个新的Promise对象
		 */
		catch: function (onRejected) {
			var isOnRejectedFunc = isFunc(onRejected);

			this._onFulfilledArr.push(null);

			if (isOnRejectedFunc) {
				this._onRejectedArr.push(onRejected);
			} else {
				this._onRejectedArr.push(null);
			}

			if (this._state === 'rejected') {
				isOnRejectedFunc && onRejected(this._reason);
			}

			var next = new Promise(null, true);
			this._nextArr.push(next)
			return next;
		},

		isFulfilled: function () {
			return this._state === 'fulfilled';
		},

		isRejected: function () {
			return this._state === 'rejected';
		}
	};

	//解决：实现或拒绝
	function resolve(promise, x) {
		if (promise._state !== 'pending') {
			return;
		}

		if (x === promise) {
			reject(promise, new TypeError('cannot resolve promise with itself'));

		} else if (x instanceof Promise) {

			if (willCauseDeadlock(promise, x)) {
				reject(promise, new TypeError('cannot resolve promise with a Promise that participates in a circular thenable chain'));
				return;
			}

			switch (x._state) {
				case 'pending':
					//remain pending until x is fulfilled or rejected
					x.then(function (value) {
						fulfill(promise, value);

					}, function (reason) {
						reject(promise, reason);
					})
					break;

				case 'fulfilled':
					fulfill(promise, x._value);
					break;

				case 'rejected':
					reject(promise, x._reason);
					break;
			}

		} else if (x && (typeof x === 'object' || typeof x === 'function')) {

			var then;
			try {
				then = x.then;

			} catch (e) {
				reject(promise, e);
			}

			if (isFunc(then)) {

				if (willCauseDeadlock(promise, x)) {
					reject(promise, new TypeError('cannot resolve promise with a thenable that participates in a circular thenable chain'));
					return;
				}

				var count = 0;
				try {
					then.call(x, function (y) {
						if (count) {
							return;
						}
						count++;

						resolve(promise, y);

					}, function (r) {
						if (count) {
							return;
						}
						count++;

						reject(promise, r);
					});

				} catch (e) {
					!count && reject(promise, e);
				}

			} else {
				fulfill(promise, x);
			}

		} else {
			fulfill(promise, x);
		}
	}

	//实现
	function fulfill(promise, value) {
		if (promise._state !== 'pending') {
			return;
		}

		promise._state = 'fulfilled';
		promise._value = value;

		var f, rtvArr = [];
		for (var i = 0, len = promise._nextArr.length; i < len; i++) {
			try {
				f = promise._onFulfilledArr[i]; //以函数方式执行回调
				rtvArr[i] = f ? [f(promise._value)] : [promise._value]; //以相同的值解决next

			} catch (e) {
				rtvArr[i] = [null, e];
			}
		}

		handleNext(promise, rtvArr);
	}

	//拒绝
	function reject(promise, reason) {
		if (promise._state !== 'pending') {
			return;
		}

		promise._state = 'rejected';
		promise._reason = reason;

		var f, rtvArr = [];
		for (var i = 0, len = promise._nextArr.length; i < len; i++) {
			try {
				f = promise._onRejectedArr[i]; //以函数方式执行回调
				rtvArr[i] = f ? [f(promise._reason)] : [null, promise._reason]; //以相同的原因拒绝next

			} catch (e) {
				rtvArr[i] = [null, e];
			}
		}

		handleNext(promise, rtvArr);
	}

	//处理后续的promise
	function handleNext(promise, rtvArr) {
		//promise已处理完毕，故清空回调以释放内存
		promise._onFulfilledArr = [];
		promise._onRejectedArr = [];

		for (var nextArr = promise._nextArr, i = 0, len = promise._nextArr.length; i < len; i++) {
			rtvArr[i][1] ? reject(nextArr[i], rtvArr[i][1]) : resolve(nextArr[i], rtvArr[i][0]);
		}
	}

	//判断是否用x来解决promise会引起死循环）
	function willCauseDeadlock(promise, x) {
		if (!promise.chain) {
			var arr = [];

			for (var i = 0, len = promise._nextArr.length; i < len; i++) { //promise._nextArr cannot be resolved from outside.
				arr.push(promise._nextArr[i]);
			}
			arr.push(promise); //prevent promise --> x --> promise
			arr.push(x);

			promise.chain = x.chain = arr;

		} else {
			for (var i = 0, len = promise.chain.length; i < len; i++) {
				if (x === promise.chain[i]) {
					return true;
				}
			}
			promise.chain[len] = x;
		}
		return false;
	}

	//判断一个值是否为函数
	function isFunc(fn) {
		return typeof fn === 'function';
	}

	//检验一个值是否为Promise数组
	function isPromiseArray(promiseArr) {
		if (!(promiseArr instanceof Array) || !promiseArr.length) {
			return false;

		} else {
			for (var i = 0, len = promiseArr.length; i < len; i++) {
				if (!(promiseArr[i] instanceof Promise)) {
					return false;
				}
			}
		}
		return true;
	}

	window.Promise = Promise;
})();