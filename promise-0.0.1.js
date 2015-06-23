/**
 * @file Promise实现
 * @author WangWeiyi
 * @version 1.0
 */

(function() {
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
		if(internal !== true && !isFunc(task)) {
			throw new TypeError('task must be a function');
		}  

		this._state = 'pending';
		this._value = undefined;
		this._reason = undefined;
		this._onFulfilledArr = [];
		this._onRejectedArr = [];
		this._next = []; //promise chain

		if(isFunc(task)) {
			var promise = this, 
				count = 0,
				delay = function(callback) {
					if(count) {
						return;
					}
					count++;
					setTimeout(callback, 0);
				};

			task(function(value) {
				delay(function() {
					resolve(promise, value);
				});

			}, function(reason) {
				delay(function() {
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
	Promise.all = function(promiseArr) {
		if( !isPromiseArray(promiseArr) ) {
			throw new TypeError('parameter must be an promise array!');		
		}

		var promise = new Promise(null, true),
			valueCount = 0,
			valueArr = [],
			addCallback = function(i) {
				promiseArr[i]._onFulfilledArr.push(function(value) {
					valueCount++;
					valueArr[i] = value;

					if(valueCount === len) {
						resolve(promise, valueArr);
					}

					//保证原onFulfilled链的行为不被破坏.
					//即：当原onFulfilledArr为空而原promise被解决时，原promise的nextPromise能正确地以value被解决
					return value; 
				});
				promiseArr[i]._onRejectedArr.push(function(reason) {
					reject(promise, reason);

					//保证原onRejected链的行为不被破坏.
					//即：当原onRejectedArr为空而原promise被拒绝时，原promise的nextPromise能正确地以reason被拒绝
					return reason; 
				});
			};

		for(var i = 0, len = promiseArr.length; i < len; i++) {
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
	Promise.race = function(promiseArr) {
		if( !isPromiseArray(promiseArr) ) {
			throw new TypeError('parameter must be an promise array!');		
		}

		var promise = new Promise(null, true),
			onFulfilledCb = function(value) {
				resolve(promise, value);
				return value; //原因参见Promise.all
			},
			onRejectedCb = function(reason) {
				reject(promise, reason);
				return reason; //原因参见Promise.all
			};		
		
		for(var i = 0, len = promiseArr.length; i < len; i++) {
			promiseArr[i]._onFulfilledArr.push(onFulfilledCb);
			promiseArr[i]._onRejectedArr.push(onRejectedCb);
		}

		return promise;
	};

	/**
	 * 返回一个被完成了的Promise对象，结果由参数value指定。若value是一个thenable, 则该Promise对象会接受其
	 *
	 * @memberOf Promise
	 * @param  {Array} promiseArr 等待执行的promise队列
	 * @return {Promise} 一个新的promise对象
	 */
	Promise.resolve = function(value) {

	};

	/**
	 * 返回一个已经被拒绝了的Promise对象，拒因由参数reason指定
	 *
	 * @memberOf Promise
	 * @param  {Any} reason Promise的拒因
	 * @return {Promise} 一个以reason为因被拒绝的Promise对象
	 */
	Promise.reject = function(reason) {
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
		then: function(onFulfilled, onRejected) {
			var isOnFulfilledFunc = isFunc(onFulfilled), 
				isonRejectedFunc = isFunc(onRejected);

			if(isOnFulfilledFunc) {
				this._onFulfilledArr.push(onFulfilled);
			}
			
			if(isonRejectedFunc) {
				this._onRejectedArr.push(onRejected);
			}

			if(this._state === 'fulfilled') {
				isOnFulfilledFunc && onFulfilled(this._value);

			} else if(this._state === 'rejected') {
				isonRejectedFunc && onRejected(this._reason);
			}

			this._next = new Promise(null, true);
			return this._next;
		},

		/**
		 * 为promise添加拒绝回调, 返回一个新的promis
		 * 
		 * @memberOf Promise#
		 * @param  {function} onRejected 拒绝回调, 接受一个参数，参数值为Promise的拒因
		 * @return {Promise}  一个新的Promise对象
		 */
		catch: function(onRejected) {
			var isonRejectedFunc = isFunc(onRejected);
			
			if(isonRejectedFunc) {
				this._onRejectedArr.push(onRejected);
			}

			if(this._state === 'rejected') {
				isonRejectedFunc && onRejected(this._reason);
			}

			this._next = new Promise(null, true);
			return this._next;
		},

		isFulfilled: function() {
			return this._state === 'fulfilled';
		},

		isRejected: function() {
			return this._state === 'rejected';
		}
	};

	//解决：实现或拒绝
	function resolve(promise, x) {
		if(promise._state !== 'pending') {
			return;
		}

		if(x === promise) {
			reject(promise, new TypeError('cannot resolve promise with itself'));
						
		} else if(x instanceof Promise) {
			
			if(inQueue(promise, x)) {
				reject(promise, new TypeError('cannot resolve promise with a Promise that participates in a circular thenable chain'));
				return;
			}

			switch(x._state) {
				case 'pending':
					//remain pending until x is fulfilled or rejected
					x._onFulfilledArr = x._onFulfilledArr.concat(promise._onFulfilledArr);
					x._onRejectedArr = x._onRejectedArr.concat(promise._onRejectedArr);
					x._next = promise._next;
					break;

				case 'fulfilled': 
					fulfill(promise, x._value);
					break;

				case 'rejected':
					reject(promise, x._reason);
					break;
			}

		} else if(x && (typeof x === 'object' || typeof x === 'function')) {
			
			var then;
			try {
				then = x.then;

			} catch(e) {
				reject(promise, e);
			}

			if (isFunc(then)) {			
				
				if(inQueue(promise, x)) {
					reject(promise, new TypeError('cannot resolve promise with a thenable that participates in a circular thenable chain'));
					return;
				}

				var count = 0;
				try {
					then.call(x, function(y) {
						if(count) {
							return;
						}
						count++;

						resolve(promise, y); 

					}, function(r) {
						if(count) {
							return;
						}
						count++;

						reject(promise, r);
					});

				} catch(e) {
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
		if(promise._state !== 'pending') {
			return;
		}
		
		promise._state = 'fulfilled';
		promise._value = value;

		var f, rtv, nextPromise = promise._next;			
		try {
			if(promise._onFulfilledArr.length) {
				for(var i = 0, len = promise._onFulfilledArr.length; i < len; i++) {
					f = promise._onFulfilledArr[i]; //直接调用时this会指向onFulfilledArr这个数组
					rtv = f(promise._value); //以函数方式调用，即非严格模式下promise为window, 严格模式下为undefined
				}

			} else {
				nextPromise && fulfill(nextPromise, promise._value);
			}

		} catch(e) {
			nextPromise && reject(nextPromise, e);
		}

		nextPromise && resolve(nextPromise, rtv);
	}

	//拒绝
	function reject(promise, reason) {
		if(promise._state !== 'pending') {
			return;
		}

		promise._state = 'rejected';
		promise._reason = reason;

		var f, rtv, nextPromise = promise._next;			
		try {
			if(promise._onRejectedArr.length) {
				for(var i = 0, len = promise._onRejectedArr.length; i < len; i++) {
					f = promise._onRejectedArr[i]; //直接调用时this会指向onRejectedArr这个数组
					rtv = f(promise._reason); //以函数方式调用，即非严格模式下promise为window, 严格模式下为undefined
				}

			} else {
				nextPromise && reject(nextPromise, promise._reason);
			}

		} catch(e) {
			nextPromise && reject(nextPromise, e);
		}

		nextPromise && resolve(nextPromise, rtv);
	}

	//判断x是否在promise的解决队列中（即如果用x来解决promise会引起死循环）
	function inQueue(promise, x) {
		if(!promise.chain) {
			//promise._next cannot be resolved from outside.
			//promise in array is to prevent promise --> x --> promise
			promise.chain = x.chain = [promise._next, promise, x]; 
		
		} else {
			for(var i = 0, len = promise.chain.length; i < len; i++) {
				if(x === promise.chain[i]) {
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
		if( !(promiseArr instanceof Array) || !promiseArr.length ) {
			return false;

		} else {
			for(var i = 0, len = promiseArr.length; i < len; i++) {
				if( !(promiseArr[i] instanceof Promise) ) {
					return false;
				}
			}
		}
		return true;
	}

	window.Promise = Promise;
})();