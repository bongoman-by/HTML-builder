const fsPromises = require('fs').promises;
const path = require('path');

const pathFolder = path.resolve(__dirname, 'secret-folder');
let filehandle;
let stat;
let ext;

async function readDir(dir) {
  try {
    const files = await fsPromises.readdir(dir, { withFileTypes: true });
    for (const file of files) {
      if (file.isFile()) {
        try {
          filehandle = await fsPromises.open(path.join(dir, file.name), 'r');
          stat = await filehandle.stat();
        } finally {
          await filehandle?.close();
        }
        ext = path.extname(file.name) || '';
        if (ext) {
          console.log(
            `${file.name.slice(0, -ext.length)} - ${ext.slice(1)} - ${
              stat.size / 1000
            }kb`
          );
        } else {
          console.log(`${file.name} - ${stat.size / 1000}kb`);
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
