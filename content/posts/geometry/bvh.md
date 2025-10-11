+++
date = '2025-09-27'
draft = true
title = 'Naive BVH'
summary = ''
tags = ["Graphics", "Geometry"]
+++

## Introduction

Это ни в коем случае не руководство по построению и использованию BVH. Такое руководство уже есть и оно находится в списке источников.
Когда я прочитал его, мне захотелось сделать код немного более современным, разложив на алгоритмы стандартной библиотеки.
Так идея, стоящая за этим кодом, становится несколько более понятной и укладывается в мозгу. 


<figure class="blog-image">
  <img src="/images/blog/BVH/bunny.png">
</figure>

Здесь я приведу короткий и простой код для построения и визуализации самой наивной версии BVH. 
Для загрузки меша я использую старый добрый [tinyobjloader](https://github.com/tinyobjloader/tinyobjloader),
для визуализации [polyscope](https://github.com/nmwsharp/polyscope), для математики [glm](https://github.com/g-truc/glm).


## Briefly about a BVH

## Preparation

От класса `BoundingBox` нам требуется только конструктор, способноть расширяться от другого `BoundingBox` и пара методов для
визуализации в виде каркаса. 

<details>
<summary>Show code</summary>

```cpp
BoundingBox() {
  auto min = std::numeric_limits<float>::lowest();
  auto max = std::numeric_limits<float>::max();
  min_ = Vector3f(max);
  max_ = Vector3f(min);
}

BoundingBox(const Vector3f &p1, const Vector3f &p2) {
  min_ = glm::min(p1, p2);
  max_ = glm::max(p1, p2);
}

void Expand(const BoundingBox &other) {
  min_ = glm::min(min_, other.min_);
  max_ = glm::max(max_, other.max_);
}

auto GetExtent() const {
  return max_ - min_;
}

uint32_t MaximumExtent() const {
  auto extent = GetExtent();
  if (extent.x > extent.y && extent.x > extent.z) return 0;
  if (extent.y > extent.z) return 1;
  return 2;
}
```
</details> 

## Building

```cpp
BVHNode(std::span<Face> primitives, std::span<const Vector3f> vertices) : primitives_(primitives) {
  for (const auto &primitive : primitives_) {
    auto p0 = vertices[primitive[0]];
    auto p1 = vertices[primitive[1]];
    auto p2 = vertices[primitive[2]];
    bounding_box_.Expand(Triangle(p0, p1, p2).GetBoundingBox());
  }
}
```

```cpp
void RecursiveBuild(BVHNode &node) {
  if (node.primitives_.size() <= primitives_maximum_) return; // Exit if the node contains less than the required number of primitives
  // The naive split position is calculated as the center of the longest axis of the Bounding Box
  auto extent = node.bounding_box_.GetExtent(); 
  auto max_axis = node.bounding_box_.MaximumExtent();
  auto position = node.bounding_box_.min_[max_axis] + extent[max_axis] * 0.5f;
  // Partition primitives by whether their center[axis] is left of the splitting plane
  auto middle = std::ranges::partition(node.primitives_, [&](auto index) { return GetTriangle(index).GetCenter()[max_axis] < position; });
  auto offset = std::distance(node.primitives_.begin(), middle.begin());
  // Return if there are no primitives in one of the nodes
  if (offset == 0 || offset == node.primitives_.size()) return;
  // Create left and right child nodes from the partitioned primitives.
  auto &node_L = nodes_.emplace_back(node.primitives_.first(offset), vertices_);
  auto &node_R = nodes_.emplace_back(node.primitives_.subspan(offset), vertices_);
  // If it is not a leaf, then it does not contain primitives.
  node.primitives_ = {};
  // Let's move on
  RecursiveBuild(node_L);
  RecursiveBuild(node_R);
}
```

## Conclusion

[Sources](https://github.com/d-krylov/abyss/blob/main/cpp/bvh/bvh.cpp)


## Sources

* [How to build a BVH](https://jacco.ompf2.com/2022/04/13/how-to-build-a-bvh-part-1-basics/)
* [Bounding Volume Hierarchies](https://www.pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies)