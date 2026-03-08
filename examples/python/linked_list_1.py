class Node:
    def __init__(self, val):
        self.val = val
        self.next = None


def append(head, val):
    if not head:
        return Node(val)
    cur = head
    while cur.next:
        cur = cur.next
    cur.next = Node(val)
    return head


if __name__ == "__main__":
    head = Node(1)
    append(head, 2)
    append(head, 3)
    while head:
        print(head.val)
        head = head.next
