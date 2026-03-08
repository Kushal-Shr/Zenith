#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

class Stack {
    Node* topNode;
    int size;
public:
    Stack() : topNode(nullptr), size(0) {}

    void push(int val) {
        Node* newNode = new Node(val);
        newNode->next = topNode;
        topNode = newNode;
        size++;
    }

    int pop() {
        if (!topNode) {
            cout << "Stack underflow!" << endl;
            return -1;
        }
        int val = topNode->data;
        Node* temp = topNode;
        topNode = topNode->next;
        delete temp;
        size--;
        return val;
    }

    int top() {
        if (!topNode) return -1;
        return topNode->data;
    }

    bool isEmpty() { return topNode == nullptr; }
    int getSize() { return size; }

    void print() {
        Node* curr = topNode;
        cout << "TOP -> ";
        while (curr) {
            cout << curr->data;
            if (curr->next) cout << " -> ";
            curr = curr->next;
        }
        cout << " -> BOTTOM" << endl;
    }

    ~Stack() {
        while (topNode) {
            Node* temp = topNode;
            topNode = topNode->next;
            delete temp;
        }
    }
};

int main() {
    Stack s;
    s.push(10);
    s.push(20);
    s.push(30);
    s.push(40);

    cout << "Stack: "; s.print();
    cout << "Top: " << s.top() << endl;
    cout << "Size: " << s.getSize() << endl;

    cout << "Popped: " << s.pop() << endl;
    cout << "Popped: " << s.pop() << endl;

    cout << "Stack after pops: "; s.print();

    return 0;
}
