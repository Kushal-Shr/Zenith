#include <iostream>
#include <vector>
using namespace std;

class MaxHeap {
    vector<int> heap;

    int parent(int i) { return (i - 1) / 2; }
    int leftChild(int i) { return 2 * i + 1; }
    int rightChild(int i) { return 2 * i + 2; }

    void heapifyUp(int i) {
        while (i > 0 && heap[parent(i)] < heap[i]) {
            swap(heap[parent(i)], heap[i]);
            i = parent(i);
        }
    }

    void heapifyDown(int i) {
        int largest = i;
        int left = leftChild(i);
        int right = rightChild(i);

        if (left < (int)heap.size() && heap[left] > heap[largest])
            largest = left;
        if (right < (int)heap.size() && heap[right] > heap[largest])
            largest = right;

        if (largest != i) {
            swap(heap[i], heap[largest]);
            heapifyDown(largest);
        }
    }

public:
    void insert(int val) {
        heap.push_back(val);
        heapifyUp(heap.size() - 1);
    }

    int extractMax() {
        if (heap.empty()) {
            cout << "Heap is empty!" << endl;
            return -1;
        }
        int maxVal = heap[0];
        heap[0] = heap.back();
        heap.pop_back();
        if (!heap.empty()) heapifyDown(0);
        return maxVal;
    }

    int peekMax() {
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
    MaxHeap h;
    int values[] = {15, 40, 10, 55, 25, 35, 20};
    for (int v : values) h.insert(v);

    cout << "Max-Heap: "; h.print();
    cout << "Max: " << h.peekMax() << endl;

    cout << "Extracting in order: ";
    while (h.size() > 0)
        cout << h.extractMax() << " ";
    cout << endl;

    return 0;
}
