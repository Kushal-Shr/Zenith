class Stack
  def initialize
    @data = []
  end

  def push(x)
    @data << x
  end

  def pop
    @data.empty? ? nil : @data.pop
  end
end

s = Stack.new
s.push(1)
s.push(2)
s.push(3)
puts s.pop
puts s.pop
