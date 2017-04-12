var example = {a: 1, b: 2};
var doSomething = function () {
  return this.a + this.b;
}
console.log(doSomething.call(example))
console.log("hello")