public class Sort2 {
    static void merge(int[] arr, int l, int m, int r) {
        int[] L = new int[m - l + 1], R = new int[r - m];
        for (int i = 0; i < L.length; i++) L[i] = arr[l + i];
        for (int j = 0; j < R.length; j++) R[j] = arr[m + 1 + j];
        int i = 0, j = 0, k = l;
        while (i < L.length && j < R.length) {
            arr[k++] = L[i] <= R[j] ? L[i++] : R[j++];
        }
        while (i < L.length) arr[k++] = L[i++];
        while (j < R.length) arr[k++] = R[j++];
    }

    static void mergeSort(int[] arr, int l, int r) {
        if (l >= r) return;
        int m = l + (r - l) / 2;
        mergeSort(arr, l, m);
        mergeSort(arr, m + 1, r);
        merge(arr, l, m, r);
    }

    public static void main(String[] args) {
        int[] arr = {38, 27, 43, 3, 9, 82, 10};
        mergeSort(arr, 0, arr.length - 1);
        for (int x : arr) System.out.print(x + " ");
    }
}
