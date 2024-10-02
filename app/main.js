const process = require('process');
const util = require('util');

function decodeStr(bencodedValue) {
  // Strings are encoded as <length>:<contents>.
  const firstColonIndex = bencodedValue.indexOf(':');
  if (firstColonIndex === -1) {
    throw new Error('Invalid encoded value', bencodedValue);
  }
  return bencodedValue.substr(firstColonIndex + 1);
}

function decodeInteger(bencodedValue) {
  // Integers are encoded as i<number>e.
  return Number(bencodedValue.substr(1, bencodedValue.length - 2));
}

function decodeList(bencodedValue) {
  // Lists are encoded as l<bencoded_elements>e.

  // <bencoded_elements> can be of the format: num:str or i<num>e
  // Break down into list and go on decoding each item
  // str: (\d:[a-zA-Z]{1,})
  // num: (i[\d]{1,}e)

  // naive/brute force approach
  let currentIndex = 1;
  let listValues = [];
  while (currentIndex < bencodedValue.length - 1) {
    if (bencodedValue[currentIndex] == 'i') {
      // integer
      const integerEndsAt =
        bencodedValue.slice(currentIndex).indexOf('e') + currentIndex + 1;
      const integerToDecode = bencodedValue.slice(currentIndex, integerEndsAt);

      listValues.push(decodeInteger(integerToDecode));
      currentIndex = integerEndsAt;
    } else if (!isNaN(bencodedValue[currentIndex])) {
      // string
      // look for : and pick the nos
      const firstColonIndex =
        bencodedValue.slice(currentIndex).indexOf(':') + currentIndex;
      const strLen = Number(bencodedValue.slice(currentIndex, firstColonIndex));
      const strToDecode = bencodedValue.slice(
        currentIndex,
        firstColonIndex + strLen + 1
      );

      listValues.push(decodeStr(strToDecode));
      currentIndex = firstColonIndex + strLen + 1;
    } else {
      throw new Error('Unable to decode ', {
        currentIndex,
        listValues,
        currentStr: bencodedValue[currentIndex],
      });
    }
  }

  return listValues;
}

function decodeBencode(bencodedValue) {
  const lastChar = bencodedValue[bencodedValue.length - 1];

  if (bencodedValue[0] == 'l' && lastChar == 'e') {
    return decodeList(bencodedValue);
  } else if (bencodedValue[0] == 'i' && lastChar == 'e') {
    return decodeInteger(bencodedValue);
  } else if (!isNaN(bencodedValue[0])) {
    return decodeStr(bencodedValue);
  } else {
    throw new Error('Unable to decode ', bencodedValue);
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
  } else {
    throw new Error(`Unknown command ${command}`);
  }
}

main();
