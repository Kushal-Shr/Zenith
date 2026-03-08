<?php
function linear_search($arr, $target) {
    foreach ($arr as $i => $x) {
        if ($x === $target) return $i;
    }
    return -1;
}
$data = [3, 7, 2, 9, 1];
echo linear_search($data, 7) . "\n";
echo linear_search($data, 5) . "\n";
