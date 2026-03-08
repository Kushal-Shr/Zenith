#include <iostream>
#include <vector>
using namespace std;

int linearSearch(const vector<int>& arr, int target) {
    for (int i = 0; i < (int)arr.size(); i++) {
        if (arr[i] == target)
            return i;
    }
    return -1;
}

int main() {
    vector<int> arr = {42, 17, 88, 5, 63, 29, 71, 50, 12, 95};
    int target = 63;

    cout << "Array: [ ";
    for (int v : arr) cout << v << " ";
    cout << "]" << endl;

    cout << "Searching for " << target << "..." << endl;

    int result = linearSearch(arr, target);

    if (result != -1)
        cout << "Found " << target << " at index " << result << endl;
    else
        cout << target << " not found in the array" << endl;

    target = 100;
    result = linearSearch(arr, target);
    cout << "Searching for " << target << ": "
         << (result != -1 ? "Found at index " + to_string(result) : "Not found")
         << endl;

    return 0;
}
