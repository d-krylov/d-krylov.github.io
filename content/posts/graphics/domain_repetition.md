+++
title = 'Notes about Domain Repetition'
date = '2025-09-27'
draft = true
math = true
summary = 'Introduction'
tags = ["Graphics", "Mathematics"]
+++

<div class="columns">
  <div class="column"> <figure class="custom-img"> <img src="/images/blog/domain_repetition/floor.png"> </figure> </div>
  <div class="column"> <figure class="custom-img"> <img src="/images/blog/domain_repetition/round.png"> </figure> </div>
</div>


## Helix

```glsl
// https://iquilezles.org/articles/distfunctions/
float sd_torus(vec3 p, float R, float r) {
  vec2 q = vec2(length(p.xz) - R, p.y);
  return length(q) - r;
}
```

```glsl
float sd_helix(vec3 p, float order, float wraps, float R, float r) {
  float l = length(p.xz) - R; // distance to the cylinder
  float n = 2.0 * PI;
  float y = order * atan(p.z, p.x) - wraps * p.y;
  float id = n * round(y / n);
  float d = y - id;
  return length(vec2(l, d)) - r;
}
```