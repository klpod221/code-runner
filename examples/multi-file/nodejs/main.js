// Multi-file example - Main file
const calculator = require('./calculator');
const utils = require('./utils');

// Using functions from imported modules
console.log("Welcome to the multi-file example");

const num1 = 15;
const num2 = 7;

console.log(`Addition: ${num1} + ${num2} = ${calculator.add(num1, num2)}`);
console.log(`Subtraction: ${num1} - ${num2} = ${calculator.subtract(num1, num2)}`);
console.log(`Multiplication: ${num1} * ${num2} = ${calculator.multiply(num1, num2)}`);
console.log(`Division: ${num1} / ${num2} = ${calculator.divide(num1, num2)}`);

// Using utility functions
console.log(`Current timestamp: ${utils.getCurrentTimestamp()}`);
console.log(`Random number between 1-100: ${utils.getRandomNumber(1, 100)}`);
utils.printMessage("This is a multi-file Node.js application!");