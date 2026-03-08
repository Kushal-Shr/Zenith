fn binary_search(arr: &[i32], target: i32) -> Option<usize> {
    let mut lo = 0;
    let mut hi = arr.len().saturating_sub(1);
    while lo <= hi {
        let mid = (lo + hi) / 2;
        if arr[mid] == target {
            return Some(mid);
        }
        if arr[mid] < target {
            lo = mid + 1;
        } else {
            hi = mid.saturating_sub(1);
        }
    }
    None
}

fn main() {
    let data = [1, 3, 5, 7, 9];
    println!("{:?}", binary_search(&data, 5));
    println!("{:?}", binary_search(&data, 4));
}
