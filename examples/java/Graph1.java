import java.util.*;

public class Graph1 {
    static ArrayList<ArrayList<Integer>> adj;
    static int V;

    static void addEdge(int u, int v) {
        adj.get(u).add(v);
    }

    static void bfs(int s) {
        boolean[] vis = new boolean[V];
        Queue<Integer> q = new LinkedList<>();
        q.add(s);
        vis[s] = true;
        while (!q.isEmpty()) {
            int u = q.poll();
            System.out.print(u + " ");
            for (int v : adj.get(u)) {
                if (!vis[v]) { vis[v] = true; q.add(v); }
            }
        }
    }

    public static void main(String[] args) {
        V = 4;
        adj = new ArrayList<>();
        for (int i = 0; i < V; i++) adj.add(new ArrayList<>());
        addEdge(0, 1);
        addEdge(0, 2);
        addEdge(1, 2);
        addEdge(2, 0);
        addEdge(2, 3);
        bfs(2);
    }
}
