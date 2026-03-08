class Queue
  def initialize
    @data = []
  end

  def enqueue(x)
    @data << x
  end

  def dequeue
    @data.empty? ? nil : @data.shift
  end
end

q = Queue.new
q.enqueue(1)
q.enqueue(2)
q.enqueue(3)
puts q.dequeue
puts q.dequeue
