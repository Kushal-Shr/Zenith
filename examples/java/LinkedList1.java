public class LinkedList1 {
    static class Node {
        int data;
        Node next;
        Node(int d) { data = d; next = null; }
    }

    static Node head;

    static void insertEnd(int val) {
        Node n = new Node(val);
        if (head == null) { head = n; return; }
        Node curr = head;
        while (curr.next != null) curr = curr.next;
        curr.next = n;
    }

    static void print() {
        Node curr = head;
        while (curr != null) {
            System.out.print(curr.data + (curr.next != null ? " -> " : " -> null\n"));
            curr = curr.next;
        }
    }

    public static void main(String[] args) {
        insertEnd(10);
        insertEnd(20);
        insertEnd(30);
        print();
    }
}
