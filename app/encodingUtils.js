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

function encodeInBencode(data) {
  let result = '';
  Object.entries(data).map(([key, value]) => {
    let encodedKey = `${key.length}:${key}`;
    let encodedValue;
    // data can be integer
    if (!isNaN(value)) {
      encodedValue = `i${value}e`;
    } else {
      encodedValue = `${value.length}:${value}`;
    }
    result += encodedKey + encodedValue;
  });

  return 'd' + result + 'e';
}

module.exports = { encodeInBencode };
