using System;

class Tree1
{
    class Node { public int Data; public Node Left, Right; }

    static void Main()
    {
        Node root = null;
        root = Insert(root, 5);
        root = Insert(root, 3);
        root = Insert(root, 7);
        root = Insert(root, 1);
        Inorder(root);
        Console.WriteLine();
    }

    static Node Insert(Node node, int data)
    {
        if (node == null) return new Node { Data = data };
        if (data < node.Data) node.Left = Insert(node.Left, data);
        else node.Right = Insert(node.Right, data);
        return node;
    }

    static void Inorder(Node node)
    {
        if (node == null) return;
        Inorder(node.Left);
        Console.Write(node.Data + " ");
        Inorder(node.Right);
    }
}
