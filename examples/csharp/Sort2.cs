using System;

class Sort2
{
    static void Main()
    {
        int[] arr = { 64, 25, 12, 22, 11 };
        SelectionSort(arr);
        Console.WriteLine(string.Join(", ", arr));
    }

    static void SelectionSort(int[] arr)
    {
        for (int i = 0; i < arr.Length - 1; i++)
        {
            int minIdx = i;
            for (int j = i + 1; j < arr.Length; j++)
                if (arr[j] < arr[minIdx]) minIdx = j;
            (arr[i], arr[minIdx]) = (arr[minIdx], arr[i]);
        }
    }
}
