#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* left;
    Node* right;
    Node(int val) : data(val), left(nullptr), right(nullptr) {}
};

Node* insert(Node* root, int val) {
    if (!root) return new Node(val);
    if (val < root->data) root->left = insert(root->left, val);
    else if (val > root->data) root->right = insert(root->right, val);
    return root;
}

Node* findMin(Node* root) {
    while (root->left) root = root->left;
    return root;
}

Node* remove(Node* root, int val) {
    if (!root) return nullptr;
    if (val < root->data) {
        root->left = remove(root->left, val);
    } else if (val > root->data) {
        root->right = remove(root->right, val);
    } else {
        if (!root->left) {
            Node* temp = root->right;
            delete root;
            return temp;
        }
        if (!root->right) {
            Node* temp = root->left;
            delete root;
            return temp;
        }
        Node* successor = findMin(root->right);
        root->data = successor->data;
        root->right = remove(root->right, successor->data);
    }
    return root;
}

Node* search(Node* root, int target) {
    if (!root || root->data == target) return root;
    if (target < root->data) return search(root->left, target);
    return search(root->right, target);
}

void inorder(Node* root) {
    if (!root) return;
    inorder(root->left);
    cout << root->data << " ";
    inorder(root->right);
}

void freeTree(Node* root) {
    if (!root) return;
    freeTree(root->left);
    freeTree(root->right);
    delete root;
}

int main() {
    Node* root = nullptr;
    int values[] = {50, 30, 70, 20, 40, 60, 80};
    for (int v : values) root = insert(root, v);

    cout << "Inorder: ";
    inorder(root);
    cout << endl;

    Node* found = search(root, 60);
    cout << "Search 60: " << (found ? "Found" : "Not found") << endl;

    root = remove(root, 30);
    cout << "After removing 30: ";
    inorder(root);
    cout << endl;

    freeTree(root);
    return 0;
}
