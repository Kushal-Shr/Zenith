using System;

class Search2
{
    static void Main()
    {
        int[] arr = { 1, 3, 5, 7, 9, 11 };
        int target = 7;
        int index = BinarySearch(arr, target);
        Console.WriteLine(index >= 0 ? $"Found at index {index}" : "Not found");
    }

    static int BinarySearch(int[] arr, int target)
    {
        int left = 0, right = arr.Length - 1;
        while (left <= right)
        {
            int mid = left + (right - left) / 2;
            if (arr[mid] == target) return mid;
            if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}
