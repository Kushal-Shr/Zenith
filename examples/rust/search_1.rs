fn linear_search(arr: &[i32], target: i32) -> Option<usize> {
    for (i, &x) in arr.iter().enumerate() {
        if x == target {
            return Some(i);
        }
    }
    None
}

fn main() {
    let data = [3, 7, 2, 9, 1];
    println!("{:?}", linear_search(&data, 7));
    println!("{:?}", linear_search(&data, 5));
}
