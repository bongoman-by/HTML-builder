const fs = require('fs');
const path = require('path');
const fsPromises = require('fs').promises;

const pathFolder = path.resolve(__dirname, 'styles');
const output = fs.createWriteStream(
  path.resolve(__dirname, 'project-dist/bundle.css')
);

let ext;
let isEmpty = true;

function readFile(pathFile) {
  const stream = fs.createReadStream(pathFile, 'utf-8');
  let data = '';
  stream.on('data', (chunk) => (data += chunk));
  stream.on('end', () => {
    output.write(isEmpty ? data : `\n${data}`);
    isEmpty = false;
  });
  stream.on('error', (error) => console.log(error));
}

async function readDir(dir) {
  try {
    const files = await fsPromises.readdir(dir, { withFileTypes: true });
    for (const file of files) {
      if (file.isFile()) {
        ext = path.extname(file.name) || '';
        if (ext === '.css') {
          readFile(path.join(dir, file.name));
        }
      } else {
        readDir(path.join(dir, file.name));
      }
    }
  } catch (err) {
    console.error(err);
  }
}

readDir(pathFolder);
