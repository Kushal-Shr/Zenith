using System;

class Sort1
{
    static void Main()
    {
        int[] arr = { 64, 34, 25, 12, 22, 11, 90 };
        BubbleSort(arr);
        Console.WriteLine(string.Join(", ", arr));
    }

    static void BubbleSort(int[] arr)
    {
        for (int i = 0; i < arr.Length - 1; i++)
            for (int j = 0; j < arr.Length - 1 - i; j++)
                if (arr[j] > arr[j + 1])
                    (arr[j], arr[j + 1]) = (arr[j + 1], arr[j]);
    }
}
