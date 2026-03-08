public class Stack1 {
    static int[] arr = new int[100];
    static int top = -1;

    static void push(int x) {
        if (top < arr.length - 1) arr[++top] = x;
    }

    static int pop() {
        return top >= 0 ? arr[top--] : -1;
    }

    static int peek() {
        return top >= 0 ? arr[top] : -1;
    }

    public static void main(String[] args) {
        push(10);
        push(20);
        push(30);
        System.out.println(pop());
        System.out.println(peek());
    }
}
