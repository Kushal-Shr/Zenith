/*
 * ═══════════════════════════════════════════════
 *  ZENITH GUIDE: Doubly Linked Lists
 * ═══════════════════════════════════════════════
 *
 * Struct Node:
 *   Value
 *   Pointer to next node
 *   Pointer to previous node
 *
 * Class DoublyLinkedList:
 *   Head pointer
 *   Tail pointer
 *
 * Function InsertAtEnd(value):
 *   Create a new Node with value.
 *   If list is empty, set head and tail to new Node.
 *   Else, set new_Node.prev to current tail.
 *   Set current tail.next to new_Node.
 *   Update tail to new_Node.
 *
 * Function DeleteNode(node_to_delete):
 *   If node_to_delete.prev exists, set node_to_delete.prev.next to node_to_delete.next.
 *   If node_to_delete.next exists, set node_to_delete.next.prev to node_to_delete.prev.
 *   If node_to_delete is head, update head to node_to_delete.next.
 *   If node_to_delete is tail, update tail to node_to_delete.prev.
 *   Deallocate node_to_delete.
 *
 * ═══════════════════════════════════════════════
 *  Implement the logic above using C++.
 *  Use the LeetCode / GFG links for reference.
 * ═══════════════════════════════════════════════
 */

#include <iostream>

// Pseudocode for Doubly Linked List Operations will be inserted here.

struct Node
{
    int data;
    Node *next; // Pointer to next node
    Node *prev; // Pointer to previous node
    Node(int val) : data(val), next(nullptr), prev(nullptr) {}
};

class DoublyLinkedList
{
public:
    Node *head;
    Node *tail;

    DoublyLinkedList() : head(nullptr), tail(nullptr) {}

    // TODO: Implement insertAtEnd(int val)
    void insertAtEnd(int val)
    {
        // Your implementation here
    }

    // TODO: Implement deleteNode(int val)
    void deleteNode(int val)
    {
        // Your implementation here
    }

    // TODO: Implement printListForward()
    void printListForward()
    {
        // Your implementation here
    }

    // TODO: Implement printListBackward()
    void printListBackward()
    {
        // Your implementation here
    }

    // TODO: Implement destructor to free memory
    ~DoublyLinkedList()
    {
        // Your implementation here
    }
};

int main()
{
    // TODO: Test your DoublyLinkedList implementation
    DoublyLinkedList dll;

    dll.insertAtEnd(10);
    dll.insertAtEnd(20);
    dll.insertAtEnd(30);

    std::cout << "List forward: ";
    dll.printListForward(); // Expected: 10 <-> 20 <-> 30 <-> NULL

    std::cout << "List backward: ";
    dll.printListBackward(); // Expected: 30 <-> 20 <-> 10 <-> NULL

    dll.deleteNode(20);
    std::cout << "List after deleting 20 (forward): ";
    dll.printListForward(); // Expected: 10 <-> 30 <-> NULL

    return 0;
}