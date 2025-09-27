#include <algorithm>
#include <map>
#include <ranges>
#include <span>
#include <vector>
#include <cassert>

using IndexType = int32_t;
using EdgeType = std::pair<IndexType, IndexType>;
using Facet = std::vector<IndexType>;

constexpr IndexType INVALID_INDEX = -1;

struct EdgeData {
  EdgeType edge;
  IndexType next;
  IndexType facet;
};

struct Halfedge {
  bool operator==(const Halfedge &) const = default;

  IndexType vertex_{INVALID_INDEX}; // index into the vertex array: start vertex of this halfedge
  IndexType face_{INVALID_INDEX};   // index into the face array: the face lying to the left of this halfedge
  IndexType next_{INVALID_INDEX};   // index into the halfedge array: the next halfedge around the same face
  IndexType edge_{INVALID_INDEX};   // index into the edge array: the edge this halfedge belongs to
  IndexType twin_{INVALID_INDEX};   // index into the halfedge array: the opposite halfedge of the same edge
};

std::vector<Halfedge> halfedges_; // Array of all halfedges
std::vector<IndexType> vertices_; // For each vertex, stores the index of an arbitrary outgoing halfedge
std::vector<IndexType> faces_;    // For each face, stores the index of an arbitrary halfedge belonging to it
std::vector<IndexType> edges_;    // For each edge, stores the index of one of its two halfedges

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

void Build(std::span<const Facet> facets) {
  auto vertices_count = std::ranges::max(facets | std::views::join) + 1;
  auto facets_count = facets.size();

  vertices_.resize(vertices_count, INVALID_INDEX);
  faces_.resize(facets_count, INVALID_INDEX);

  auto edge_data_vector = GetEdgeData(facets);

  for (const auto &[edge_index, edge_data] : std::views::enumerate(edge_data_vector)) {
    halfedges_.emplace_back(edge_data.edge.first, edge_data.facet, edge_data.next);
    vertices_[edge_data.edge.first] = edge_index;
    if (faces_[edge_data.facet] == INVALID_INDEX) {
      faces_[edge_data.facet] = edge_index;
    }
  }

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
}

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

  assert(halfedges_[0] == Halfedge(0, 0, 1, 0, 22));
  assert(halfedges_[1] == Halfedge(1, 0, 2, 1, 7));
  assert(halfedges_[2] == Halfedge(2, 0, 3, 2, 16));
  assert(halfedges_[3] == Halfedge(3, 0, 0, 3, 13));

  assert(halfedges_[4] == Halfedge(1, 1, 5, 4, 21));
  assert(halfedges_[5] == Halfedge(5, 1, 6, 5, 11));
  assert(halfedges_[6] == Halfedge(6, 1, 7, 6, 17));
  assert(halfedges_[7] == Halfedge(2, 1, 4, 1, 1));

  assert(halfedges_[8] == Halfedge(5, 2, 9, 7, 20));
  assert(halfedges_[9] == Halfedge(4, 2, 10, 8, 15));
  assert(halfedges_[10] == Halfedge(7, 2, 11, 9, 18));
  assert(halfedges_[11] == Halfedge(6, 2, 8, 5, 5));

  assert(halfedges_[12] == Halfedge(4, 3, 13, 10, 23));
  assert(halfedges_[13] == Halfedge(0, 3, 14, 3, 3));
  assert(halfedges_[14] == Halfedge(3, 3, 15, 11, 19));
  assert(halfedges_[15] == Halfedge(7, 3, 12, 8, 9));

  assert(halfedges_[16] == Halfedge(3, 4, 17, 2, 2));
  assert(halfedges_[17] == Halfedge(2, 4, 18, 6, 6));
  assert(halfedges_[18] == Halfedge(6, 4, 19, 9, 10));
  assert(halfedges_[19] == Halfedge(7, 4, 16, 11, 14));

  assert(halfedges_[20] == Halfedge(4, 5, 21, 7, 8));
  assert(halfedges_[21] == Halfedge(5, 5, 22, 4, 4));
  assert(halfedges_[22] == Halfedge(1, 5, 23, 0, 0));
  assert(halfedges_[23] == Halfedge(0, 5, 20, 10, 12));

  assert(halfedges_[vertices_[0]].vertex_ == 0);
  assert(halfedges_[vertices_[1]].vertex_ == 1);
  assert(halfedges_[vertices_[2]].vertex_ == 2);
  assert(halfedges_[vertices_[3]].vertex_ == 3);
  assert(halfedges_[vertices_[4]].vertex_ == 4);
  assert(halfedges_[vertices_[5]].vertex_ == 5);
  assert(halfedges_[vertices_[6]].vertex_ == 6);
  assert(halfedges_[vertices_[7]].vertex_ == 7);

  assert(halfedges_[edges_[0]].edge_ == 0);
  assert(halfedges_[edges_[1]].edge_ == 1);
  assert(halfedges_[edges_[2]].edge_ == 2);
  assert(halfedges_[edges_[3]].edge_ == 3);
  assert(halfedges_[edges_[4]].edge_ == 4);
  assert(halfedges_[edges_[5]].edge_ == 5);
  assert(halfedges_[edges_[6]].edge_ == 6);
  assert(halfedges_[edges_[7]].edge_ == 7);

  assert(halfedges_[faces_[0]].face_ == 0);
  assert(halfedges_[faces_[1]].face_ == 1);
  assert(halfedges_[faces_[2]].face_ == 2);
  assert(halfedges_[faces_[3]].face_ == 3);
  assert(halfedges_[faces_[4]].face_ == 4);
  assert(halfedges_[faces_[5]].face_ == 5);

  return 0;
}