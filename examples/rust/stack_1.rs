struct Stack<T> {
    data: Vec<T>,
}

impl<T> Stack<T> {
    fn new() -> Self {
        Stack { data: Vec::new() }
    }
    fn push(&mut self, x: T) {
        self.data.push(x);
    }
    fn pop(&mut self) -> Option<T> {
        self.data.pop()
    }
}

fn main() {
    let mut s = Stack::new();
    s.push(1);
    s.push(2);
    println!("{:?}", s.pop());
    println!("{:?}", s.pop());
}
