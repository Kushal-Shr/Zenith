<?php
function bfs($graph, $start) {
    $visited = [];
    $q = new SplQueue();
    $q->enqueue($start);
    $result = [];
    while (!$q->isEmpty()) {
        $v = $q->dequeue();
        if (isset($visited[$v])) continue;
        $visited[$v] = true;
        $result[] = $v;
        foreach ($graph[$v] ?? [] as $u) {
            if (!isset($visited[$u])) $q->enqueue($u);
        }
    }
    return $result;
}
$g = [0 => [1, 2], 1 => [2], 2 => [0, 3], 3 => [3]];
echo implode(',', bfs($g, 2)) . "\n";
