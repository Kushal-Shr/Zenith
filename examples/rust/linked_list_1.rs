#[derive(Debug)]
struct Node {
    val: i32,
    next: Option<Box<Node>>,
}

fn append(head: &mut Option<Box<Node>>, val: i32) {
    let mut cur = head;
    while cur.as_ref().unwrap().next.is_some() {
        cur = &mut cur.as_mut().unwrap().next;
    }
    cur.as_mut().unwrap().next = Some(Box::new(Node { val, next: None }));
}

fn main() {
    let mut head = Some(Box::new(Node { val: 1, next: None }));
    append(&mut head, 2);
    append(&mut head, 3);
    let mut cur = &head;
    while let Some(n) = cur {
        println!("{}", n.val);
        cur = &n.next;
    }
}
