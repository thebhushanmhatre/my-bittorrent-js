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

// <bencoded_elements> can be of the format: num:str or i<num>e
// Break down into list and go on decoding each item
// str: (\d:[a-zA-Z]{1,}) (\d:[a-zA-Z]+)
// num: (i[\d]{1,}e)      (i[\d]+e)

// const strRegex = /(\d+:\w+)*/;
// const intRegex = /(i\d+e)*/;
// const multiCombisListRegex = new RegExp(strRegex.source + intRegex.source + strRegex.source + intRegex);

// ll3:hoti897e2:one5:supere => [["hot",897,"on"],"super"]
//  ll3:hoti897ee5:supere => [["hot",897],"super"]
function decodeList(bencodedValue, listValues = [], currentIndex = 1) {
  // Lists are encoded as l<bencoded_elements>e.
  // naive/brute force approach
  if (
    currentIndex >= bencodedValue.length - 1 ||
    bencodedValue[currentIndex] == 'e'
  ) {
    return listValues;
  }

  if (bencodedValue[currentIndex] == 'l') {
    // list - list can contain integer, string or other list
    let nestedList = decodeList(bencodedValue, [], currentIndex + 1);

    // for new index, find it using the last element from nestedList;
    let newIndex;
    const lastElement = nestedList[nestedList.length - 1];
    if (typeof lastElement == 'number') {
      let remainingItems = bencodedValue
        .slice(currentIndex + 1)
        .split(String(lastElement) + 'e')[1];
      newIndex = bencodedValue.length - remainingItems.length + 1;
    } else if (typeof lastElement == 'string') {
      let remainingItems = bencodedValue
        .slice(currentIndex + 1)
        .split(lastElement)[1];
      newIndex = bencodedValue.length - remainingItems.length + 1;
    } else {
      console.log('Shit');
    }

    listValues.push(nestedList);
    return decodeList(bencodedValue, listValues, newIndex);
  } else if (bencodedValue[currentIndex] == 'i') {
    // integer: everything between i n e
    const integerEndsAt =
      bencodedValue.slice(currentIndex).indexOf('e') + currentIndex + 1;
    const integerToDecode = bencodedValue.slice(currentIndex, integerEndsAt);
    listValues.push(decodeInteger(integerToDecode));
    currentIndex = integerEndsAt;
    return decodeList(bencodedValue, listValues, currentIndex);
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
    return decodeList(bencodedValue, listValues, currentIndex);
  } else {
    throw new Error('Unable to decode ', {
      currentIndex,
      listValues,
      currentStr: bencodedValue[currentIndex],
    });
  }
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
