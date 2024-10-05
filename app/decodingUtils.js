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
// ll3:hoti897ee5:supere => [["hot",897],"super"]
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
    throw new Error('Unable to decode ');
  }
}

// d3:foo6:orange5:helloi52ee => {"foo":"orange","hello":52}
// d10:inner_dictd4:key16:value14:key2i42e8:list_keyl5:item15:item2i3eeee
// => {"inner_dict":{"key1":"value1","key2":42,"list_key":["item1","item2",3]}}
function decodeDictionary(bencodedValue, result = {}, currentIndex = 1) {
  // A dictionary is encoded as d<key1><value1>...<keyN><valueN>e.
  // <key1>, <value1> etc. correspond to the bencoded keys & values.
  // The keys are sorted in lexicographical order and must be strings.
  // For example, {"hello": 52, "foo":"bar"} would be encoded as: d3:foo3:bar5:helloi52ee

  if (
    currentIndex >= bencodedValue.length - 1 ||
    bencodedValue[currentIndex] == 'e'
  ) {
    return result;
  }

  // key must string,
  // extract key
  const firstColonIndex = bencodedValue.slice(currentIndex).indexOf(':');
  if (firstColonIndex === -1) {
    throw new Error('Invalid encoded value', bencodedValue);
  }
  const keyLen = Number(
    bencodedValue.slice(currentIndex, currentIndex + firstColonIndex)
  );
  const valueStartIndex = currentIndex + firstColonIndex + keyLen + 1; // +1 to go to next char after key
  const key = bencodedValue.substr(currentIndex + firstColonIndex + 1, keyLen);

  // extract value and then iterate to next key-value pair
  if (bencodedValue[valueStartIndex] == 'd') {
    // Nested Dictionary
    const nestedDict = decodeDictionary(bencodedValue, {}, valueStartIndex + 1);
    result[key] = nestedDict;

    // for new index, cannot use the last element because order changes in dict
    // return decodeDictionary(bencodedValue, result, newIndex);

    // trying to skip some cases
    return result;
  } else if (bencodedValue[valueStartIndex] == 'l') {
    // list - list can contain integer, string or other list
    let nestedList = decodeList(bencodedValue, [], valueStartIndex + 1);

    // for new index, find it using the last element from nestedList;
    let newIndex;
    const lastElement = nestedList[nestedList.length - 1];
    if (typeof lastElement == 'number') {
      let remainingItems = bencodedValue
        .slice(valueStartIndex + 1)
        .split(String(lastElement) + 'e')[1];
      newIndex = bencodedValue.length - remainingItems.length + 1;
    } else if (typeof lastElement == 'string') {
      let remainingItems = bencodedValue
        .slice(valueStartIndex + 1)
        .split(lastElement)[1];
      newIndex = bencodedValue.length - remainingItems.length + 1;
    } else {
      console.log('Shit');
    }

    result[key] = nestedList;
    return decodeDictionary(bencodedValue, result, newIndex);
  } else if (bencodedValue[valueStartIndex] == 'i') {
    // integer: everything between i n e
    const integerEndsAt =
      bencodedValue.slice(valueStartIndex).indexOf('e') + valueStartIndex + 1;
    const integerToDecode = bencodedValue.slice(valueStartIndex, integerEndsAt);

    result[key] = decodeInteger(integerToDecode);
    const nextCurrentIndex = integerEndsAt;
    return decodeDictionary(bencodedValue, result, nextCurrentIndex);
  } else if (!isNaN(bencodedValue[valueStartIndex])) {
    // string
    // look for : and pick the nos
    const firstColonIndex =
      bencodedValue.slice(valueStartIndex).indexOf(':') + valueStartIndex;
    const strLen = Number(
      bencodedValue.slice(valueStartIndex, firstColonIndex)
    );
    const strToDecode = bencodedValue.slice(
      valueStartIndex,
      firstColonIndex + strLen + 1
    );
    result[key] = decodeStr(strToDecode);
    const nextCurrentIndex = firstColonIndex + strLen + 1;
    return decodeDictionary(bencodedValue, result, nextCurrentIndex);
  } else {
    console.log('ELSE', {
      currentIndex,
      firstColonIndex,
      keyLen,
      valueStartIndex,
      startChar: bencodedValue[valueStartIndex],
      key,
      result,
    });
    throw new Error('Unable to decode ');
  }
}
// d10:inner_ d  i  ctd4:key 1  6:value14  : key2i42e8  : list_keyl  5 :item15:i  t em2i3eeee
// 0123456789 10 11 23456789 20 123456789 30 123456789 40 123456789 50 123456789 60 123456789

// d10:inner_ d ictd4:key 1 6:value14  : key2i42e8  : list_keyl  5 :item15:i  t em2i3eee4  :spam5:ema  ile
// 0123456789101123456789 20 123456789 30 123456789 40 123456789 50 123456789 60 123456789 70123456789 802

module.exports = { decodeStr, decodeInteger, decodeList, decodeDictionary };
