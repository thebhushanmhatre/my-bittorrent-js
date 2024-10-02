const process = require('process');
const util = require('util');

// Examples:
// - decodeBencode("5:hello") -> "hello"
// - decodeBencode("10:hello12345") -> "hello12345"
function decodeBencode(bencodedValue) {
  // Check if the first character is a digit
  if (bencodedValue[0] == 'i') {
    const strLength = bencodedValue.length;
    return bencodedValue.substr(1, strLength - 2);
  } else if (!isNaN(bencodedValue[0])) {
    const firstColonIndex = bencodedValue.indexOf(':');
    if (firstColonIndex === -1) {
      throw new Error('Invalid encoded value');
    }
    return bencodedValue.substr(firstColonIndex + 1);
  } else {
    throw new Error('Only strings are supported at the moment');
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
