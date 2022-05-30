// bind
function bind(obj) {
  if (typeof this !== "function") throw Error();
  const args = Array.prototype.slice.call(arguments, 1);
  const self = this;
  function F() {
    if (this instanceof F) {
      return new self(...args, ...arguments)
    }
    return self.apply(args.concat([...arguments]))
  }
  return F;
}

// new
function myNew(constructor) {
  const obj = {};
  obj.__proto__ = constructor.prototype;
  const result = constructor.apply(obj, arguments);
  return typeof result === "object" && result !== null ? result : obj;
}

// instanceof
function instanceOf(obj, target) {
  let left = obj.__proto__;
  let right = target.prototype;
  while (true) {
    if (right === null) return false;
    if (left !== right) {
      left = left.__proto__;
    } else {
      return  true;
    }
  }
}

// debounce
function debounce(fn, delay) {
  let timer = null;
  return function () {
    const args = arguments;
    const self = this;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.call(self, ...args)
    }, delay)
  }
}

// throttle
function throttle(fn, delay) {
  let nowDate = Date.now();
  return function () {
    if (Date.now() - nowDate > delay) {
      fn.call(this, ...arguments)
      nowDate = Date.now();
    }
  }
}

// curry
function curry() {
  function judge() {
    
  }
}


