use std::collections::VecDeque;

fn main() {
    let mut q: VecDeque<i32> = VecDeque::new();
    q.push_back(1);
    q.push_back(2);
    q.push_back(3);
    println!("{:?}", q.pop_front());
    println!("{:?}", q.pop_front());
    println!("{:?}", q.pop_front());
}
