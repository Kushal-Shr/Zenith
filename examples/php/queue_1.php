<?php
$q = new SplQueue();
$q->enqueue(1);
$q->enqueue(2);
echo $q->dequeue() . "\n";
echo $q->dequeue() . "\n";
