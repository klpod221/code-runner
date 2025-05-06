// Calculator module

/**
 * Add two numbers
 */
exports.add = (a, b) => {
  return a + b;
};

/**
 * Subtract b from a
 */
exports.subtract = (a, b) => {
  return a - b;
};

/**
 * Multiply two numbers
 */
exports.multiply = (a, b) => {
  return a * b;
};

/**
 * Divide a by b
 */
exports.divide = (a, b) => {
  if (b === 0) {
    throw new Error("Division by zero is not allowed");
  }
  return a / b;
};