const process = require('process');
const util = require('util');
const fs = require('fs');
const {
  decodeStr,
  decodeInteger,
  decodeList,
  decodeDictionary,
} = require('./decodingUtils');

function decodeBencode(bencodedValue) {
  const lastChar = bencodedValue[bencodedValue.length - 1];

  if (bencodedValue[0] == 'd' && lastChar == 'e') {
    return decodeDictionary(bencodedValue);
  } else if (bencodedValue[0] == 'l' && lastChar == 'e') {
    return decodeList(bencodedValue);
  } else if (bencodedValue[0] == 'i' && lastChar == 'e') {
    return decodeInteger(bencodedValue);
  } else if (!isNaN(bencodedValue[0])) {
    return decodeStr(bencodedValue);
  } else {
    throw new Error('Unable to decode ');
  }
}

function main() {
  const command = process.argv[2];

  // Uncomment this block to pass the first stage
  if (command === 'decode') {
    const bencodedValue = process.argv[3];

    // In JavaScript, there's no need to manually convert bytes to string for printing
    // because JS doesn't distinguish between bytes and strings in the same way Python does.
    console.log(JSON.stringify(decodeBencode(bencodedValue)));
  } else if (command === 'info') {
    const filePath = process.argv[3];
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }

      const decodedData = decodeBencode(data);
      console.log('Tracker URL:', decodedData.announce);
      console.log('Length:', decodedData.info.length);
    });
  } else {
    throw new Error(`Unknown command ${command}`);
  }
}

main();
