public class Search1 {
    static int linearSearch(int[] arr, int key) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == key) return i;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] arr = {5, 12, 8, 3, 19, 7};
        int key = 8;
        int idx = linearSearch(arr, key);
        System.out.println(idx >= 0 ? "Found at " + idx : "Not found");
    }
}
