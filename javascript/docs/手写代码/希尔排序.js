const needSortArr = [12, 32, 31, 15, 35, 9, 38, 61, 28, 49, 41, 10, 39]
//                    0   1   2   3   4  5   6   7   8   9  10   11  12

function shellSort(arr) {
  let len = arr.length,
    temp,
    gap = 1;
  console.log('arr length:', len);

  while(gap < len / 3) {          //动态定义间隔序列
    gap = gap * 3 + 1;
  }
  console.log('gap:', gap);

  for (gap; gap > 0; gap = Math.floor(gap / 3)) {
    console.log('gap in loop:', gap);

    for (var i = gap; i < len; i++) {
      temp = arr[i];

      for (var j = i - gap; j >= 0 && arr[j] > temp; j = j - gap) {
        console.log('temp', temp, ', i:', i, ', j', j, ', j + gap:', j+gap);
        arr[j + gap] = arr[j];
      }
      arr[j + gap] = temp;
    }
  }
  return arr;
}


shellSort(needSortArr);

console.log('sorted', needSortArr);
