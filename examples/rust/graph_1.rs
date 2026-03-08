use std::collections::VecDeque;

fn bfs(graph: &[Vec<usize>], start: usize) -> Vec<usize> {
    let mut visited = vec![false; graph.len()];
    let mut q = VecDeque::from([start]);
    let mut result = Vec::new();
    while let Some(v) = q.pop_front() {
        if visited[v] {
            continue;
        }
        visited[v] = true;
        result.push(v);
        for &u in &graph[v] {
            if !visited[u] {
                q.push_back(u);
            }
        }
    }
    result
}

fn main() {
    let g: Vec<Vec<usize>> = vec![vec![1, 2], vec![2], vec![0, 3], vec![3]];
    println!("{:?}", bfs(&g, 2));
}
