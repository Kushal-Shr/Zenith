using System;
using System.Collections.Generic;

class Graph1
{
    static void Main()
    {
        var adj = new Dictionary<int, List<int>>();
        adj[0] = new List<int> { 1, 2 };
        adj[1] = new List<int> { 2 };
        adj[2] = new List<int> { 0, 3 };
        adj[3] = new List<int> { 3 };
        BFS(adj, 2);
    }

    static void BFS(Dictionary<int, List<int>> adj, int start)
    {
        var visited = new HashSet<int>();
        var queue = new Queue<int>();
        queue.Enqueue(start);
        visited.Add(start);
        while (queue.Count > 0)
        {
            int v = queue.Dequeue();
            Console.Write(v + " ");
            foreach (int n in adj.GetValueOrDefault(v, new List<int>()))
                if (!visited.Contains(n)) { visited.Add(n); queue.Enqueue(n); }
        }
        Console.WriteLine();
    }
}
