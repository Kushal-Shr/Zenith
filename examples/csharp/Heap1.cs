using System;
using System.Collections.Generic;

class Heap1
{
    static List<int> heap = new List<int>();

    static void Main()
    {
        Insert(5);
        Insert(3);
        Insert(8);
        Insert(1);
        Console.WriteLine(ExtractMin());
        Console.WriteLine(ExtractMin());
    }

    static void Insert(int val)
    {
        heap.Add(val);
        int i = heap.Count - 1;
        while (i > 0 && heap[(i - 1) / 2] > heap[i])
        {
            (heap[i], heap[(i - 1) / 2]) = (heap[(i - 1) / 2], heap[i]);
            i = (i - 1) / 2;
        }
    }

    static int ExtractMin()
    {
        if (heap.Count == 0) return -1;
        int min = heap[0];
        heap[0] = heap[^1];
        heap.RemoveAt(heap.Count - 1);
        int i = 0;
        while (true)
        {
            int smallest = i, left = 2 * i + 1, right = 2 * i + 2;
            if (left < heap.Count && heap[left] < heap[smallest]) smallest = left;
            if (right < heap.Count && heap[right] < heap[smallest]) smallest = right;
            if (smallest == i) break;
            (heap[i], heap[smallest]) = (heap[smallest], heap[i]);
            i = smallest;
        }
        return min;
    }
}
