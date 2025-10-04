+++
date = '2025-09-27'
draft = false
title = 'Doubly Connected Edge List: Building'
summary = ''
tags = ["Graphics", "Geometry"]
+++

## Introduction

A polygonal mesh is a collection of vertices, edges, and faces that together define the shape of a 3D object. There are many ways to represent a mesh in data structures, but one of the most widely used is the Doubly Connected Edge List (DCEL) - more commonly known as the Halfedge structure. Despite how often it's mentioned in computer graphics, there isn’t that much clear, step-by-step information online about how to actually build it or work with it. That's what motivated me to write this guide.

Before we dive in, a quick disclaimer: this article is not a full-fledged reference. A production-ready implementation of Halfedge has to deal with many tricky corner cases, and I'll be skipping most of them here for the sake of clarity. The goal is to understand the core idea and the logic behind the structure.

To get started, all we need is a list of faces with a consistent orientation - for simplicity, we'll assume all faces are oriented counterclockwise. In the Halfedge model, every edge is split into two directed halfedges pointing in opposite directions. This simple definition immediately highlights an important issue: in real meshes, edges don’t always have exactly two incident faces. If they have only one, we call them boundary edges. If they have more than two, they're non-manifold edges, and handling those correctly is a lot more complicated. For this article, we'll assume the mesh is "well-behaved" and avoid the non-manifold case.

At the core of the structure is the halfedge itself. Each halfedge stores three key pieces of information:

* the vertex it originates from,
* the face to its left,
* the next halfedge along that face.

Optionally, a halfedge may also store:
* the edge it belongs to,
* its twin (the opposite halfedge that lies on the neighboring face).

In some implementations, these optional values can even be derived implicitly through simple index arithmetic. Others also include a pointer to the previous halfedge, though this isn't strictly necessary, since it can be found by walking the face in order.

Finally, Halfedge structures can be implemented either with pointers or with indices. In practice, index-based implementations tend to be more compact, easier to serialize, and often just more convenient to work with. That's the approach I'll be using in the rest of this article.

## Internal structure

Let's get started. Below are all the core structures we'll be working with: 

```cpp
using IndexType = int32_t;

constexpr IndexType INVALID_INDEX = -1;

struct Halfedge {
  IndexType vertex_; // index into the vertex array: start vertex of this halfedge
  IndexType face_;   // index into the face array: the face lying to the left of this halfedge
  IndexType next_;   // index into the halfedge array: the next halfedge around the same face
  IndexType edge_;   // index into the edge array: the edge this halfedge belongs to
  IndexType twin_;   // index into the halfedge array: the opposite halfedge of the same edge
};

std::vector<Halfedge> halfedges_; // Array of all halfedges
std::vector<IndexType> vertices_; // For each vertex, stores the index of an arbitrary outgoing halfedge
std::vector<IndexType> faces_;    // For each face, stores the index of an arbitrary halfedge belonging to it
std::vector<IndexType> edges_;    // For each edge, stores the index of one of its two halfedges
```

Their purpose has already been covered in the introduction, so there's no need to repeat it here.
The code is fairly self-explanatory, and in this case it speaks louder than words.

## Building

Before we start building the structure, we need to allocate space for the vertex and face arrays. 
This is necessary because we'll be accessing them by index during construction. Why do we calculate the vertex array size this way?
Typically, mesh vertices are numbered starting from zero, which means the maximum vertex index across all faces will always be one less than the total vertex count. That's why we add +1 when computing the size.

```cpp
using Facet = std::vector<IndexType>;

void Build(std::span<const Facet> facets) {
  auto vertices_count = std::ranges::max(facets | std::views::join) + 1;
  auto facets_count = facets.size();

  vertices_.resize(vertices_count, INVALID_INDEX);
  faces_.resize(facets_count, INVALID_INDEX);
  // ...
}
```

The next step is to collect information about the edges. For each face, the last edge loops back to the first one. As a result, the index of that edge in the edge array differs from the current edge index by the size of the face. We go through the vertices of each face in order and record: the source and target vertices of the edge, the index of the next halfedge, and the face index.

```cpp
using EdgeType = std::pair<IndexType, IndexType>;

struct EdgeData {
  EdgeType edge;
  IndexType next;
  IndexType facet;
};

std::vector<EdgeData> GetEdgeData(std::span<const Facet> facets) {
  std::vector<EdgeData> out;
  IndexType first_edge = 0;
  for (const auto &[facet_index, facet] : std::views::enumerate(facets)) {
    auto facet_size = facet.size();
    for (auto i = 0; i < facet.size(); i++) {
      auto source_vertex = facet[i];
      auto target_vertex = facet[(i + 1) % facet_size];
      auto next = ++first_edge - (i == facet_size - 1) * facet_size;
      out.emplace_back(std::make_pair(source_vertex, target_vertex), next, facet_index);
    }
  }
  return out;
}
```

Once we have the EdgeData, filling most of the half-edge fields is straightforward: the source vertex, the face to the left, and the pointer to the next half-edge. Each face, in turn, always points to the first half-edge belonging to it. At this point, the only remaining fields to fill are the edge and the twin halfedge.

```cpp
  // ...
  auto edge_data_vector = GetEdgeData(facets);

  for (const auto &[edge_index, edge_data] : std::views::enumerate(edge_data_vector)) {
    halfedges_.emplace_back(edge_data.edge.first, edge_data.facet, edge_data.next);
    vertices_[edge_data.edge.first] = edge_index;
    if (faces_[edge_data.facet] == INVALID_INDEX) {
      faces_[edge_data.facet] = edge_index;
    }
  }
```

The final step is to establish connections between halfedges by filling in the edge and twin information. 
The logic here is simple: when we encounter an edge for the first time, we record it.
When we see the same edge again but with reversed vertex order, we’ve found its twin and can link the two halfedges together.
Keep in mind that this code assumes the mesh is well-formed, where each edge has at most two adjacent faces.
For non-manifold geometry (for example, when more than two faces share the same edge), different handling would be required.

```cpp
  std::map<EdgeType, IndexType> edge_he_index_map;

  for (const auto &[edge_index, edge_data] : std::views::enumerate(edge_data_vector)) {
    auto minmax = std::minmax(edge_data.edge.first, edge_data.edge.second);
    if (edge_he_index_map.contains(minmax)) {
      auto previous_index_he = edge_he_index_map[minmax];
      auto previous_index_edge = halfedges_[previous_index_he].edge_;
      halfedges_[edge_index].edge_ = previous_index_edge;
      halfedges_[edge_index].twin_ = previous_index_he;
      halfedges_[previous_index_he].twin_ = edge_index;
    } else {
      edge_he_index_map[minmax] = edge_index;
      halfedges_[edge_index].edge_ = edges_.size();
      edges_.emplace_back(edge_index);
    }
  }
```

## Testing

For a simple test, let’s use a cube:

```cpp
int main() {
  std::vector<std::vector<IndexType>> facets{
      {0, 1, 2, 3}, // FRONT
      {1, 5, 6, 2}, // RIGHT
      {5, 4, 7, 6}, // BACK
      {4, 0, 3, 7}, // LEFT
      {3, 2, 6, 7}, // TOP
      {4, 5, 1, 0}  // BOTTOM
  };

  Build(facets);
}
```

Below is a diagram for clarity:

<figure class="blog-image">
  <img src="/images/blog/DCEL/he_box.png">
</figure>

The full tests can be found in the complete program provided in the conclusion.
They are fairly straightforward and mainly serve to verify that the structure is built correctly.

## Conclusion

Here is the complete code for building the Halfedge structure. As we can see, for meshes where every edge connects exactly two faces, the implementation is fairly straightforward. I hope to cover more complex cases in future articles in this series.

In the next article, I plan to dive into navigating the resulting structure. For well-defined, boundary-free meshes, this task is not particularly difficult.

<details>
  <summary>Show sources</summary>
{{< include-code file="/static/code/cpp/dcel/dcel_building.cpp" lang="cpp" >}}
</details>

## Sources

1. [Half-Edge Data Structures by Jerry Yin and Jeffrey Goh](https://jerryyin.info/geometry-processing-algorithms/half-edge/)
2. [Halfedge mesh internals in Geometry Central documentation](https://geometry-central.net/surface/surface_mesh/internals/)
3. [Half-edge based mesh representations: theory](https://fgiesen.wordpress.com/2012/02/21/half-edge-based-mesh-representations-theory/)
4. [Half-edge based mesh representations: practice](https://fgiesen.wordpress.com/2012/03/24/half-edge-based-mesh-representations-practice/)
5. [Half-edge data structure considered harmful](https://sandervanrossen.blogspot.com/2017/09/half-edge-data-structure-considered.html)
6. [The Polygon Mesh Processing Library github](https://github.com/pmp-library/pmp-library)
7. [Geometry Central github](https://github.com/nmwsharp/geometry-central)
8. [Yotam Gingold halfedge implementation github](https://github.com/yig/halfedge)