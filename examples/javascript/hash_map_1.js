class HashMap {
  constructor() { this.buckets = new Map(); }
  set(key, val) { this.buckets.set(key, val); }
  get(key) { return this.buckets.get(key); }
  delete(key) { return this.buckets.delete(key); }
  has(key) { return this.buckets.has(key); }
}

const map = new HashMap();
map.set("a", 1); map.set("b", 2); map.set("c", 3);
console.log(map.get("b"));
map.delete("c");
console.log(map.has("c"));
