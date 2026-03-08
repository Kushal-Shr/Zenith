public class Search2 {
    static int binarySearch(int[] arr, int key) {
        int lo = 0, hi = arr.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] == key) return mid;
            if (arr[mid] < key) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] arr = {2, 5, 8, 12, 16, 23, 38};
        int key = 12;
        int idx = binarySearch(arr, key);
        System.out.println(idx >= 0 ? "Found at " + idx : "Not found");
    }
}
