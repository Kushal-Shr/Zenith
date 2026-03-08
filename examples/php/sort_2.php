<?php
function selection_sort($arr) {
    $n = count($arr);
    for ($i = 0; $i < $n - 1; $i++) {
        $min = $i;
        for ($j = $i + 1; $j < $n; $j++) {
            if ($arr[$j] < $arr[$min]) $min = $j;
        }
        if ($min !== $i) list($arr[$i], $arr[$min]) = [$arr[$min], $arr[$i]];
    }
    return $arr;
}
$data = [64, 34, 25, 12, 22];
echo implode(',', selection_sort($data)) . "\n";
