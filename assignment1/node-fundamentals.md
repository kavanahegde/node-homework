# Node.js Fundamentals

## What is Node.js?

Node.js is a JavaScript runtime that allows us to run JavaScript outside of a web browser. It is built on the V8 JavaScript engine and is commonly used to create server-side applications and other tools.

## How does Node.js differ from running JavaScript in the browser?

JavaScript in the browser runs mainly to interact with web pages and has access to browser features such as the DOM and window object. Node.js runs outside the browser and provides features such as access to the file system, operating system, and network connections.

## What is the V8 engine, and how does Node use it?

V8 is the JavaScript engine developed by Google for Chrome. It converts JavaScript code into machine code so it can run efficiently. Node.js uses the V8 engine to execute JavaScript code outside of the browser.

## What are some key use cases for Node.js?

Node.js is commonly used for web servers, REST APIs, real-time applications, command-line tools, and applications that need to handle many network requests. It is also useful for building backend services.

## Explain the difference between CommonJS and ES Modules. Give a code example of each

**CommonJS (default in Node.js):**

    const fs = require('fs');

    module.exports = fs;

**ES Modules (supported in modern Node.js):**

    import fs from 'fs';

    export default fs;
    