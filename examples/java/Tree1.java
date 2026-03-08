public class Tree1 {
    static class Node {
        int data;
        Node left, right;
        Node(int d) { data = d; left = right = null; }
    }

    static Node root;

    static Node insert(Node n, int val) {
        if (n == null) return new Node(val);
        if (val < n.data) n.left = insert(n.left, val);
        else n.right = insert(n.right, val);
        return n;
    }

    static void inorder(Node n) {
        if (n == null) return;
        inorder(n.left);
        System.out.print(n.data + " ");
        inorder(n.right);
    }

    public static void main(String[] args) {
        root = insert(root, 50);
        insert(root, 30);
        insert(root, 70);
        insert(root, 20);
        insert(root, 40);
        inorder(root);
    }
}
