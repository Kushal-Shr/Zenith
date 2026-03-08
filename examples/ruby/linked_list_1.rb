class Node
  attr_accessor :val, :next
  def initialize(val)
    @val = val
    @next = nil
  end
end

def append(head, val)
  return Node.new(val) unless head
  cur = head
  cur = cur.next while cur.next
  cur.next = Node.new(val)
  head
end

head = Node.new(1)
head = append(head, 2)
head = append(head, 3)
head = append(head, 4)
while head
  puts head.val
  head = head.next
end
