const process = require('process');
const { stdout, stdin, exit } = process;
const fs = require('fs');
const path = require('path');

const pathFile = path.resolve(__dirname, 'text.txt');
const output = fs.createWriteStream(pathFile);

function init() {
  fs.writeFile(pathFile, '', () => {
    stdout.write('Cоздан новый файл. Введите новое сообщение:\n');
  });
}

fs.access('text.txt', fs.F_OK, (err) => {
  if (err) {
    init();
    return;
  }
});

stdin.on('data', (data) => {
  const message = data.toString();
  if (message === '\r\n') {
    stdout.write('Нужно ввести новое сообщение:\n');
  } else {
    output.write(message);
    stdout.write('Введите новое сообщение:\n');
  }
});

process.on('SIGINT', function () {
  stdout.write('Ваши сообщения записаны.');
  exit();
});
