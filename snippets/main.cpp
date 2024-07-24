#include <iostream>
#include <stack>
#include <vector>

using namespace std;

void Visit(uint32_t current_vertex) {
  cout << "Visit " << current_vertex << endl;
}

int main() {
  uint32_t n, m;
  uint32_t x, y;
  cin >> n >> m;
  vector<vector<uint32_t>> graph(n);
  for (uint32_t i = 0; i < m; i++) {
    cin >> x >> y;
    graph[x].push_back(y);
    graph[y].push_back(x);
  }
  stack<uint32_t> stack;
  vector<uint32_t> visited(n, 0);
  stack.push(0);
  while (stack.empty() == false) {
    auto current_vertex = stack.top();
    stack.pop();
    if (visited[current_vertex] == 0) {
      Visit(current_vertex);
      visited[current_vertex] = 1;
      for (auto neighbour : graph[current_vertex]) {
        if (visited[neighbour] == 0) {
          stack.push(neighbour);
        }
      }
    }
  }
  return 0;
}