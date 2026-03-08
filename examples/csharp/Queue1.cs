using System;

class Queue1
{
    static void Main()
    {
        int[] queue = new int[10];
        int front = 0, rear = -1;
        rear = Enqueue(queue, rear, 5);
        rear = Enqueue(queue, rear, 10);
        rear = Enqueue(queue, rear, 15);
        Console.WriteLine(Dequeue(queue, ref front, rear));
        Console.WriteLine(Dequeue(queue, ref front, rear));
    }

    static int Enqueue(int[] q, int rear, int val)
    {
        q[++rear] = val;
        return rear;
    }

    static int Dequeue(int[] q, ref int front, int rear)
    {
        return front <= rear ? q[front++] : -1;
    }
}
