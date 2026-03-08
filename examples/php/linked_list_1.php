<?php
class Node {
    public $val;
    public $next;
    function __construct($val) { $this->val = $val; $this->next = null; }
}
class LinkedList {
    public $head;
    function append($val) {
        $node = new Node($val);
        if ($this->head === null) { $this->head = $node; return; }
        $cur = $this->head;
        while ($cur->next !== null) $cur = $cur->next;
        $cur->next = $node;
    }
}
$list = new LinkedList();
$list->append(1);
$list->append(2);
$list->append(3);
$cur = $list->head;
while ($cur !== null) { echo $cur->val . "\n"; $cur = $cur->next; }
