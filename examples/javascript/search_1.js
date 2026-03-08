function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}

const arr = [3, 7, 2, 9, 1, 5];
console.log(linearSearch(arr, 9));
console.log(linearSearch(arr, 4));
