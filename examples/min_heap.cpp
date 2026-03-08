#include <iostream>
#include <vector>
using namespace std;

class MinHeap {
    vector<int> heap;

    int parent(int i) { return (i - 1) / 2; }
    int leftChild(int i) { return 2 * i + 1; }
    int rightChild(int i) { return 2 * i + 2; }

    void heapifyUp(int i) {
        while (i > 0 && heap[parent(i)] > heap[i]) {
            swap(heap[parent(i)], heap[i]);
            i = parent(i);
        }
    }

    void heapifyDown(int i) {
        int smallest = i;
        int left = leftChild(i);
        int right = rightChild(i);

        if (left < (int)heap.size() && heap[left] < heap[smallest])
            smallest = left;
        if (right < (int)heap.size() && heap[right] < heap[smallest])
            smallest = right;

        if (smallest != i) {
            swap(heap[i], heap[smallest]);
            heapifyDown(smallest);
        }
    }

public:
    void insert(int val) {
        heap.push_back(val);
        heapifyUp(heap.size() - 1);
    }

    int extractMin() {
        if (heap.empty()) {
            cout << "Heap is empty!" << endl;
            return -1;
        }
        int minVal = heap[0];
        heap[0] = heap.back();
        heap.pop_back();
        if (!heap.empty()) heapifyDown(0);
        return minVal;
    }

    int peekMin() {
        if (heap.empty()) return -1;
        return heap[0];
    }

    void print() {
        cout << "[ ";
        for (int v : heap) cout << v << " ";
        cout << "]" << endl;
    }

    int size() { return heap.size(); }
};

int main() {
    MinHeap h;
    int values[] = {35, 10, 25, 5, 40, 15, 30};
    for (int v : values) h.insert(v);

    cout << "Min-Heap: "; h.print();
    cout << "Min: " << h.peekMin() << endl;

    cout << "Extracting in order: ";
    while (h.size() > 0)
        cout << h.extractMin() << " ";
    cout << endl;

    return 0;
}
