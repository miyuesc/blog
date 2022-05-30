const needSortArr = [12, 32, 31, 15, 35, 9, 38, 61, 28, 49, 41, 10, 39]
//                    0   1   2   3   4  5   6   7   8   9  10   11  12

function merge(left, right) {
  let i = 0;
  let j = 0;
  const result = [];
  while (i < left.length && j < right.length) {
    result.push(left[i] < right[j] ? left[i++] : right[j++]);
  }
  return result.concat(i < left.length ? left.slice(i) : right.slice(j));
}

function mergeSort(array) {
  if (array.length > 1) {
    const { length } = array;
    const middle = Math.floor(length / 2);
    const left = mergeSort(array.slice(0, middle));
    const right = mergeSort(array.slice(middle, length));
    array = merge(left, right);
  }
  return array;
}

let data = mergeSort(needSortArr);


console.log(data);
