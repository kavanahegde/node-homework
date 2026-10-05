const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');

if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
console.log('Platform:', os.platform());
console.log('CPU:', os.cpus()[0].model);
console.log('Total Memory:', os.totalmem());

// Path module
const joinedPath = path.join(
  sampleFilesDir,
  'folder',
  'file.txt'
);
console.log('Joined path:', joinedPath);

// fs.promises API
const demoFile = path.join(sampleFilesDir, 'demo.txt');

fs.promises
  .writeFile(demoFile, 'Hello from fs.promises!')
  .then(() => fs.promises.readFile(demoFile, 'utf8'))
  .then((data) => {
    console.log('fs.promises read:', data);
  })
  .catch((err) => {
    console.error('fs.promises error:', err);
  });

// Streams for large files
const largeFile = path.join(sampleFilesDir, 'largefile.txt');
const lines = Array.from(
  { length: 100 },
  (_, index) => `This is line ${index + 1} of the large file.`
).join('\n');

fs.writeFileSync(largeFile, lines);

const readStream = fs.createReadStream(largeFile, {
  encoding: 'utf8',
  highWaterMark: 1024,
});

readStream.on('data', (chunk) => {
  console.log('Read chunk:', chunk.slice(0, 40));
});

readStream.on('end', () => {
  console.log('Finished reading large file with streams.');
});

readStream.on('error', (err) => {
  console.error('Stream error:', err);
});