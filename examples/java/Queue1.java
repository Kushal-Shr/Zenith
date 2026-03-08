public class Queue1 {
    static int[] arr = new int[100];
    static int front = 0, rear = -1, size = 0;

    static void enqueue(int x) {
        if (size < arr.length) {
            rear = (rear + 1) % arr.length;
            arr[rear] = x;
            size++;
        }
    }

    static int dequeue() {
        if (size == 0) return -1;
        int x = arr[front];
        front = (front + 1) % arr.length;
        size--;
        return x;
    }

    public static void main(String[] args) {
        enqueue(10);
        enqueue(20);
        enqueue(30);
        System.out.println(dequeue());
        System.out.println(dequeue());
    }
}
