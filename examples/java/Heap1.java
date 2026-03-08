import java.util.ArrayList;

public class Heap1 {
    static ArrayList<Integer> heap = new ArrayList<>();

    static void swap(int i, int j) {
        int t = heap.get(i);
        heap.set(i, heap.get(j));
        heap.set(j, t);
    }

    static void insert(int x) {
        heap.add(x);
        int i = heap.size() - 1;
        while (i > 0 && heap.get((i - 1) / 2) > heap.get(i)) {
            swap(i, (i - 1) / 2);
            i = (i - 1) / 2;
        }
    }

    static int extractMin() {
        if (heap.isEmpty()) return -1;
        int min = heap.get(0);
        heap.set(0, heap.get(heap.size() - 1));
        heap.remove(heap.size() - 1);
        int i = 0, n = heap.size();
        while (2 * i + 1 < n) {
            int j = 2 * i + 1;
            if (j + 1 < n && heap.get(j + 1) < heap.get(j)) j++;
            if (heap.get(i) <= heap.get(j)) break;
            swap(i, j);
            i = j;
        }
        return min;
    }

    public static void main(String[] args) {
        insert(30);
        insert(10);
        insert(20);
        insert(5);
        System.out.println(extractMin());
        System.out.println(extractMin());
    }
}
