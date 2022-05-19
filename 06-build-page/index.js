const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');

let source;
let destination;
const destinationDir = 'project-dist';
const pathStylesFolder = path.join(__dirname, 'styles');
let isEmpty = true;
let outputStyles;

(async () => {
  try {
    await fsPromises.access(path.join(__dirname, destinationDir));
    outputStyles = fs.createWriteStream(
      path.join(__dirname, destinationDir, 'style.css')
    );
  } catch {
    try {
      await fsPromises.mkdir(path.join(__dirname, destinationDir));
      console.log('create ', destinationDir);
      outputStyles = fs.createWriteStream(
        path.join(__dirname, destinationDir, 'style.css')
      );
    } catch (err) {
      console.error(err);
    }
  }
})();

async function copyAssets(dir) {
  const files = await fsPromises.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    if (!(file.name.includes('assets') || dir.includes('assets'))) continue;
    if (file.isFile()) {
      try {
        await fsPromises.copyFile(
          path.join(dir, file.name),
          path.join(dir.replace(source, destination), file.name)
        );
      } catch (err) {
        console.log(err);
      }
    } else {
      if (dir == __dirname) {
        source = path.join(dir, file.name);
        destination = path.join(dir, destinationDir, file.name);
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
          await fsPromises.access(
            path.join(dir.replace(source, destination), file.name)
          );
        } catch {
          try {
            await fsPromises.mkdir(
              path.join(dir.replace(source, destination), file.name)
            );
          } catch (err) {
            console.error(err);
          }
        }
      }
      copyAssets(path.join(dir, file.name));
    }
  }
}

const findHtml = function (dir, done) {
  let results = [];
  fs.readdir(dir, { withFileTypes: true }, function (err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function (file) {
      if (
        file.name.includes('test-files') ||
        dir.includes('test-files') ||
        file.name.includes(destinationDir) ||
        dir.includes(destinationDir)
      ) {
        if (!--pending) done(null, results);
        return;
      }
      if (file.isFile()) {
        const ext = path.extname(file.name) || '';
        if (ext && ext === '.html') {
          results.push({
            path: path.join(dir, file.name),
            file: `${file.name.slice(0, -ext.length)}`,
            ext: ext,
          });
        }
        if (!--pending) done(null, results);
      } else {
        findHtml(path.join(dir, file.name), function (err, res) {
          results = results.concat(res);
          if (!--pending) done(null, results);
        });
      }
    });
  });
};

const readHtml = function (pathFile) {
  return new Promise(function (resolve, reject) {
    let data = '';
    const stream = fs.createReadStream(pathFile, 'utf-8');
    stream.on('data', (chunk) => (data += chunk));
    stream.on('end', () => {
      resolve(data);
    });
    stream.on('error', (err) => {
      reject(err);
    });
  });
};

function readWrightFile(pathFile) {
  const stream = fs.createReadStream(pathFile, 'utf-8');

  let data = '';
  stream.on('data', (chunk) => (data += chunk));
  stream.on('end', () => {
    outputStyles.write(isEmpty ? data : `\n${data}`, (err) => {
      if (err) throw err;
    });
    isEmpty = false;
  });
  stream.on('error', (err) => {
    throw err;
  });
}

async function findStyleFiles(dir) {
  let ext;
  const files = await fsPromises.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isFile()) {
      ext = path.extname(file.name) || '';
      if (ext === '.css') {
        readWrightFile(path.join(dir, file.name));
      }
    } else {
      findStyleFiles(path.join(dir, file.name));
    }
  }
}

try {
  copyAssets(__dirname);
  findHtml(__dirname, function (err, filesHtmlArray) {
    if (err) throw err;
    readHtml(filesHtmlArray.find((obj) => obj.file === 'template').path).then(
      (template) => {
        let templateArray = [template];
        (async function () {
          for (let current of filesHtmlArray) {
            if (current.file !== 'template') {
              const html = await readHtml(current.path);
              templateArray.push(
                templateArray[templateArray.length - 1].replace(
                  `{{${current.file}}}`,
                  html
                )
              );
            }
          }
        })().then(() => {
          fs.writeFile(
            path.join(__dirname, destinationDir, 'index.html'),
            templateArray[templateArray.length - 1],
            (err) => {
              if (err) throw err;
            }
          );
        });
      }
    );
  });
  findStyleFiles(pathStylesFolder);
} catch (error) {
  console.error(error);
}
