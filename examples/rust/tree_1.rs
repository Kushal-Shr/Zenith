#[derive(Debug)]
struct Node {
    val: i32,
    left: Option<Box<Node>>,
    right: Option<Box<Node>>,
}

fn inorder(node: &Option<Box<Node>>) {
    if let Some(n) = node {
        inorder(&n.left);
        println!("{}", n.val);
        inorder(&n.right);
    }
}

fn main() {
    let root = Some(Box::new(Node {
        val: 2,
        left: Some(Box::new(Node {
            val: 1,
            left: None,
            right: None,
        })),
        right: Some(Box::new(Node {
            val: 3,
            left: None,
            right: None,
        })),
    }));
    inorder(&root);
}
