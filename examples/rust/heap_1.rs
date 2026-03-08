use std::collections::BinaryHeap;

fn main() {
    let mut h: BinaryHeap<i32> = BinaryHeap::new();
    h.push(3);
    h.push(1);
    h.push(4);
    h.push(2);
    println!("{:?}", h.pop());
    println!("{:?}", h.pop());
    println!("{:?}", h.pop());
}
