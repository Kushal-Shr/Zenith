<?php
class Node {
    public $val;
    public $left;
    public $right;
    function __construct($val) { $this->val = $val; $this->left = $this->right = null; }
}
function insert($root, $val) {
    if ($root === null) return new Node($val);
    if ($val < $root->val) $root->left = insert($root->left, $val);
    else $root->right = insert($root->right, $val);
    return $root;
}
function inorder($root) {
    if ($root === null) return [];
    return array_merge(inorder($root->left), [$root->val], inorder($root->right));
}
$root = null;
foreach ([4, 2, 6, 1, 3] as $v) $root = insert($root, $v);
echo implode(',', inorder($root)) . "\n";
