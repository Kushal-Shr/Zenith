using System;

class LinkedList1
{
    class Node { public int Data; public Node Next; }

    static void Main()
    {
        Node head = null;
        head = Insert(head, 3);
        head = Insert(head, 1);
        head = Insert(head, 2);
        Print(head);
    }

    static Node Insert(Node head, int data)
    {
        Node node = new Node { Data = data, Next = head };
        return node;
    }

    static void Print(Node head)
    {
        while (head != null) { Console.Write(head.Data + " "); head = head.Next; }
        Console.WriteLine();
    }
}
