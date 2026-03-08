#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* prev;
    Node* next;
    Node(int val) : data(val), prev(nullptr), next(nullptr) {}
};

class DoublyLinkedList {
    Node* head;
    Node* tail;
public:
    DoublyLinkedList() : head(nullptr), tail(nullptr) {}

    void pushBack(int val) {
        Node* newNode = new Node(val);
        if (!tail) {
            head = tail = newNode;
        } else {
            tail->next = newNode;
            newNode->prev = tail;
            tail = newNode;
        }
    }

    void pushFront(int val) {
        Node* newNode = new Node(val);
        if (!head) {
            head = tail = newNode;
        } else {
            newNode->next = head;
            head->prev = newNode;
            head = newNode;
        }
    }

    void remove(int val) {
        Node* curr = head;
        while (curr && curr->data != val) curr = curr->next;
        if (!curr) return;
        if (curr->prev) curr->prev->next = curr->next;
        else head = curr->next;
        if (curr->next) curr->next->prev = curr->prev;
        else tail = curr->prev;
        delete curr;
    }

    void printForward() {
        Node* curr = head;
        while (curr) {
            cout << curr->data;
            if (curr->next) cout << " <-> ";
            curr = curr->next;
        }
        cout << endl;
    }

    void printBackward() {
        Node* curr = tail;
        while (curr) {
            cout << curr->data;
            if (curr->prev) cout << " <-> ";
            curr = curr->prev;
        }
        cout << endl;
    }

    ~DoublyLinkedList() {
        Node* curr = head;
        while (curr) {
            Node* temp = curr;
            curr = curr->next;
            delete temp;
        }
    }
};

int main() {
    DoublyLinkedList dll;
    dll.pushBack(10);
    dll.pushBack(20);
    dll.pushBack(30);
    dll.pushFront(5);
    dll.pushFront(1);

    cout << "Forward:  "; dll.printForward();
    cout << "Backward: "; dll.printBackward();

    dll.remove(20);
    cout << "After removing 20: "; dll.printForward();

    return 0;
}
