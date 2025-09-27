+++
date = '2025-09-05'
draft = true
title = 'Doubly Connected Edge List: Navigation'
summary = ''
tags = ["Graphics", "Geometry"]
+++


Get halfedges around vertex:
```cpp
std::vector<IndexType> GetHalfedgesAroundVertex(IndexType index) {
  std::vector<IndexType> out;
  auto start_halfedge = vertices_[index];
  auto current_halfedge = start_halfedge;
  do {
    out.emplace_back(current_halfedge);
    auto twin = halfedges_[current_halfedge].twin_;
    current_halfedge = halfedges_[twin].next_;
  } while (current_halfedge != start_halfedge);
  return out;
}
```

```cpp
std::vector<IndexType> GetVerticesAroundVertex(IndexType index) {
  std::vector<IndexType> out;
  auto start_halfedge = vertices_[index];
  auto current_halfedge = start_halfedge;
  do {
    auto twin = halfedges_[current_halfedge].twin_;
    auto vertex = halfedges_[twin].vertex_;
    out.emplace_back(vertex);
    current_halfedge = halfedges_[twin].next_;
  } while (current_halfedge != start_halfedge);
  return out;
}
```
