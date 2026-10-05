const fs = require('fs');
const path = require('path');

const sampleDir = path.join(__dirname, 'sample-files');
const sampleFile = path.join(sampleDir, 'sample.txt');

// Write a sample file programmatically for the demonstration.
fs.mkdirSync(sampleDir, { recursive: true });
fs.writeFileSync(sampleFile, 'Hello, async world!');

// 1. Callback style
fs.readFile(sampleFile, 'utf8', (err, data) => {
  if (err) {
    console.error('Callback error:', err);
    return;
  }

  console.log('Callback:', data);

  // Callback hell happens when callbacks are nested inside other callbacks.
  // This can make code difficult to read, maintain, and handle errors in.
  //
  // Example:
  // fs.readFile('file1.txt', 'utf8', (err, data1) => {
  //   fs.readFile('file2.txt', 'utf8', (err, data2) => {
  //     fs.readFile('file3.txt', 'utf8', (err, data3) => {
  //       console.log(data3);
  //     });
  //   });
  // });
});

// 2. Promise style
const readFilePromise = () => {
  return fs.promises.readFile(sampleFile, 'utf8');
};

readFilePromise()
  .then((data) => {
    console.log('Promise:', data);
  })
  .catch((err) => {
    console.error('Promise error:', err);
  });

// 3. Async/Await style
const readFileAsync = async () => {
  try {
    const data = await fs.promises.readFile(sampleFile, 'utf8');
    console.log('Async/Await:', data);
  } catch (err) {
    console.error('Async/Await error:', err);
  }
};

readFileAsync();