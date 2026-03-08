<?php
function bubble_sort($arr) {
    $n = count($arr);
    for ($i = 0; $i < $n; $i++) {
        for ($j = 0; $j < $n - 1 - $i; $j++) {
            if ($arr[$j] > $arr[$j + 1]) {
                list($arr[$j], $arr[$j + 1]) = [$arr[$j + 1], $arr[$j]];
            }
        }
    }
    return $arr;
}
$data = [64, 34, 25, 12, 22];
echo implode(',', bubble_sort($data)) . "\n";
