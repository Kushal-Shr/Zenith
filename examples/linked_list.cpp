#include <iostream>
using namespace std;

struct Node
{
    int data;
    Node *next;
    Node(int val) : data(val), next(nullptr) {}
};

void insertAtEnd(Node *&head, int val)
{
    Node *newNode = new Node(val);
    if (!head)
    {
        head = newNode;
        return;
    }
    Node *curr = head;
    while (curr->next)
        curr = curr->next;
    curr->next = newNode;
}

void deleteNode(Node *&head, int val)
{
    if (!head)
        return;
    if (head->data == val)
    {
        Node *temp = head;
        head = head->next;
        delete temp;
        return;
    }
    Node *curr = head;
    while (curr->next && curr->next->data != val)
        curr = curr->next;
    if (curr->next)
    {
        Node *temp = curr->next;
        curr->next = temp->next;
        delete temp;
    }
}

void printList(Node *head)
{
    Node *curr = head;
    while (curr)
    {
        cout << curr->data;
        if (curr->next)
            cout << " -> ";
        curr = curr->next;
    }
    cout << " -> NULL" << endl;
}

int main()
{
    Node *head = nullptr;
    insertAtEnd(head, 10);
    insertAtEnd(head, 20);
    insertAtEnd(head, 30);
    insertAtEnd(head, 40);
    insertAtEnd(head, 50);

    cout << "Original list: ";
    printList(head);

    deleteNode(head, 30);
    cout << "After deleting 30: ";
    printList(head);

    Node *curr = head;
    while (curr)
    {
        Node *temp = curr;
        curr = curr->next;
        delete temp;
    }
    return 0;
}
