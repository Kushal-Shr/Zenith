<?php
function binary_search($arr, $target) {
    $lo = 0;
    $hi = count($arr) - 1;
    while ($lo <= $hi) {
        $mid = (int)(($lo + $hi) / 2);
        if ($arr[$mid] === $target) return $mid;
        if ($arr[$mid] < $target) $lo = $mid + 1;
        else $hi = $mid - 1;
    }
    return -1;
}
$data = [1, 3, 5, 7, 9];
echo binary_search($data, 5) . "\n";
echo binary_search($data, 4) . "\n";
