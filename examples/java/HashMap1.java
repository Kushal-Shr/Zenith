import java.util.HashMap;

public class HashMap1 {
    public static void main(String[] args) {
        HashMap<String, Integer> map = new HashMap<>();
        map.put("apple", 10);
        map.put("banana", 20);
        map.put("cherry", 30);
        System.out.println(map.get("banana"));
        System.out.println(map.containsKey("apple"));
        map.put("apple", 15);
        System.out.println(map.get("apple"));
        for (String k : map.keySet()) {
            System.out.println(k + " -> " + map.get(k));
        }
    }
}
