+++
date = '2025-09-07'
draft = true
title = 'Some notes about ranges'
summary = 'This is an introduction to a series of posts about PBR.'
tags = ["C++"]
+++

```cpp
struct Vertex {
  Vector3f position_;
  Vector3f normal_;
};

std::vector<Vertex> vertices;
std::vector<Vector3f> positions;

std::ranges::transform(vertices, std::back_inserter(positions), &Vertex::position_);
```


### Leetcode

```cpp
std::vector<char> input{'a', 'a', 'a', 'b', 'b', 'c', 'd', 'd', 'd', 'f'};

auto compressor = [](auto view) {
  return (view.size() == 1) ? std::string(1, view.front()) : std::format("{}{}", view.front(), view.size());
};

auto output = input 
  | std::views::chunk_by(std::equal_to{})
  | std::views::transform(compressor)
  | std::views::join
  | std::ranges::to<std::string>();
```