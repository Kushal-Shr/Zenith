using System;

class Stack1
{
    static void Main()
    {
        int[] stack = new int[10];
        int top = -1;
        top = Push(stack, top, 5);
        top = Push(stack, top, 10);
        top = Push(stack, top, 15);
        Console.WriteLine(Pop(stack, ref top));
        Console.WriteLine(Pop(stack, ref top));
    }

    static int Push(int[] stack, int top, int val)
    {
        stack[++top] = val;
        return top;
    }

    static int Pop(int[] stack, ref int top)
    {
        return top >= 0 ? stack[top--] : -1;
    }
}
