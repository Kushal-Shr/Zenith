using System;

class Search1
{
    static void Main()
    {
        int[] arr = { 5, 2, 8, 1, 9, 3 };
        int target = 8;
        int index = LinearSearch(arr, target);
        Console.WriteLine(index >= 0 ? $"Found at index {index}" : "Not found");
    }

    static int LinearSearch(int[] arr, int target)
    {
        for (int i = 0; i < arr.Length; i++)
            if (arr[i] == target) return i;
        return -1;
    }
}
