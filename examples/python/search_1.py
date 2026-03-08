def linear_search(arr, target):
    for i, x in enumerate(arr):
        if x == target:
            return i
    return -1


if __name__ == "__main__":
    data = [3, 7, 2, 9, 1]
    print(linear_search(data, 7))
    print(linear_search(data, 5))
