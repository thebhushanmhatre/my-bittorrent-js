// Strings are encoded as <length>:<contents>.
// Integers are encoded as i<number>e.
// Lists are encoded as l<bencoded_elements>e.
// A dictionary is encoded as d<key1><value1>...<keyN><valueN>e.

// info dictionary format:
//
// {
//   length: 92063,
//   name: 'sample.txt',
//   'piece length': 32768,
//   pieces: `xyz`
// }

function encodeStr(input) {
  return `${input.length}:${input}`;
}

function encodeInteger(input) {
  return `i${input}e`;
}

function encodeList(input) {
  'l' +
    value
      .map((item) => {
        if (!isNaN(item)) {
          return encodeInteger(item);
        } else if (typeof item == 'string') {
          return encodeStr(item);
        } else if (Array.isArray(item)) {
          return encodeList(item);
        } else {
          return encodeInBencode(item);
        }
      })
      .join('') +
    'e';
}

function encodeInBencode(data) {
  let result = '';
  const keys = Object.keys(data).sort((a, b) => a.localeCompare(b));

  keys.map((key) => {
    const value = data[key];
    let encodedKey = encodeStr(key);
    let encodedValue;
    // data can be integer
    if (!isNaN(value)) {
      encodedValue = encodeInteger(value);
    } else if (typeof value == 'string') {
      encodedValue = encodeStr(value);
    } else if (Array.isArray(value)) {
      // array - l<bencoded_elements>e
      encodedValue = encodeList(value);
    } else {
      // nested dict - d<key1><value1>...<keyN><valueN>e
      encodedValue = encodeInBencode(value);
    }
    result += encodedKey + encodedValue;
  });

  return 'd' + result + 'e';
}

module.exports = { encodeInBencode };
