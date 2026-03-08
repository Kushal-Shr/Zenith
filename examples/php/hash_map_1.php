<?php
$m = ['a' => 1, 'b' => 2];
$m['c'] = 3;
echo $m['a'] . "\n";
echo $m['b'] . "\n";
echo ($m['d'] ?? 'null') . "\n";
