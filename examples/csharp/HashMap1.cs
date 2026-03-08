using System;
using System.Collections.Generic;

class HashMap1
{
    static void Main()
    {
        var dict = new Dictionary<string, int>();
        dict["apple"] = 1;
        dict["banana"] = 2;
        dict["cherry"] = 3;
        Console.WriteLine(dict["banana"]);
        foreach (var kv in dict)
            Console.WriteLine($"{kv.Key}: {kv.Value}");
    }
}
