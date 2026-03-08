use std::collections::HashMap;

fn main() {
    let mut m: HashMap<&str, i32> = HashMap::new();
    m.insert("a", 1);
    m.insert("b", 2);
    m.insert("c", 3);
    println!("{:?}", m.get("b"));
    println!("{:?}", m.get("x"));
    println!("{:?}", m);
}
