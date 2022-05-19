const fsPromises = require('fs').promises;
const path = require('path');

let source;
let destination;

async function copyDir(dir) {
  const files = await fsPromises.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isFile()) {
      if (dir !== __dirname) {
        try {
          await fsPromises.access(
            path.join(dir.replace(source, destination), file.name)
          );
        } catch {
          try {
            await fsPromises.copyFile(
              path.join(dir, file.name),
              path.join(dir.replace(source, destination), file.name)
            );
          } catch (err) {
            console.log(err);
          }
        }
      }
    } else {
      if (file.name.includes('copy', file.name - 5)) continue;
      if (dir == __dirname) {
        source = path.join(dir, file.name);
        destination = path.join(dir, `${file.name}-copy`);
        try {
          await fsPromises.access(destination);
        } catch {
          try {
            await fsPromises.mkdir(destination);
          } catch (err) {
            console.error(err);
          }
        }
      } else {
        try {
          await fsPromises.mkdir(
            path.join(dir.replace(source, destination), file.name)
          );
        } catch (err) {
          console.error(err);
        }
      }
      copyDir(path.join(dir, file.name));
    }
  }
}

try {
  copyDir(__dirname);
} catch (error) {
  console.error('catch error: ' + error.message);
}
