<?php
$h = new SplMinHeap();
$h->insert(5);
$h->insert(2);
$h->insert(8);
echo $h->extract() . "\n";
echo $h->extract() . "\n";
echo $h->extract() . "\n";
