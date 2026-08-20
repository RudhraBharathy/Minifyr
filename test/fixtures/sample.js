// Sample JavaScript file for integration tests
function greet(name) {
  const message = `Hello, ${name}! Welcome to the minification test.`;
  console.log(message);
  return message;
}

function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  let result = 0;
  for (let i = 0; i < b; i++) {
    result = add(result, a);
  }
  return result;
}

module.exports = { greet, add, multiply };
