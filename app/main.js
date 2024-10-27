const process = require('process');
const util = require('util');
const fs = require('fs');
const crypto = require('crypto');
const {
  decodeStr,
  decodeInteger,
  decodeList,
  decodeDictionary,
} = require('./decodingUtils');
const { encodeInBencode } = require('./encodingUtils');

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
  } else if (command === 'encode') {
    const dataObjectToEncode = {
      url: 'http://bittorrent-test-tracker.codecrafters.io/announce',
      length: '92063',
      name: 'sample.txt',
      'piece length': 32768,
    };
    const encodedData = encodeInBencode(dataObjectToEncode);
    console.log(encodedData);
  } else if (command === 'info') {
    const filePath = process.argv[3];
    const buff = fs.readFileSync(filePath);

    const decodedData = decodeBencode(buff.toString('binary'));
    console.log('Tracker URL:', decodedData.announce);
    console.log('Length:', decodedData.info.length);

    const bencodedInfoDict = encodeInBencode(decodedData.info);
    const tmpBuff = Buffer.from(bencodedInfoDict, 'binary');

    const shasum = crypto.createHash('sha1');
    shasum.update(tmpBuff);
    const digestResult = shasum.digest('hex');

    console.log('Info Hash:', digestResult);
  } else {
    throw new Error(`Unknown command ${command}`);
  }
}

main();
