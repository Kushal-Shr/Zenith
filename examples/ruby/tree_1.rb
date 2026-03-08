class Node
  attr_accessor :val, :left, :right
  def initialize(val)
    @val = val
    @left = @right = nil
  end
end

def insert(root, val)
  return Node.new(val) unless root
  val < root.val ? root.left = insert(root.left, val) : root.right = insert(root.right, val)
  root
end

def inorder(root)
  return [] unless root
  inorder(root.left) + [root.val] + inorder(root.right)
end

root = nil
[4, 2, 6, 1, 3].each { |x| root = insert(root, x) }
puts inorder(root).inspect
