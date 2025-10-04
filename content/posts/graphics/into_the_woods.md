+++
date = '2024-12-21T14:52:38+04:00'
draft = true
title = 'Into The Woods'
summary = 'This is an introduction to a series of posts about PBR.'
tags = ["Graphics", "Shadertoy", "L-system"]
+++

## Introduction

В этой статье я хочу разобрать как рисовать деревья с помощью реймаршинга. Техника не явлется сложной. 

*"All the branches of a tree at every stage of its height when put together are equal in thickness to the trunk"*


Rotation matrix:

```glsl
mat2 rotate(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}
```

Angle repetition from [Domain Repetition](https://iquilezles.org/articles/sdfrepetition/)

```glsl
float repeat_angle(vec2 p, float n) {
  float sp = 2.0 * PI / n;
  float an = atan(p.y, p.x);
  float id = floor(an / sp);
  return sp * id;
}
```

Мы используем это как

```glsl
float n = 3.0;
float angle = repeat_angle(p.xz, n);
p.xz *= rotate(angle + PI / n); // rotate(angle) if we use round instead floor in repeat_angle
```

Smooth minimum from [Smooth minimum for SDFs](https://iquilezles.org/articles/smin/).

```glsl
float smin_root(float a, float b, float k) {
  float x = b - a;
  return 0.5 * (a + b - sqrt(x * x + 4.0 * k * k));
}
```


Distance function from [3D SDFs](https://iquilezles.org/articles/distfunctions/). Эту функцию легко объяснить.
Если точка лежит выше высоты капсулы (или ниже нуля), то мы считаем расстояние до сферы. В ином случае до цилиндра. 
```glsl
float sd_capsule(vec3 p, float r, float h) {
  p.y -= clamp(p.y, 0.0, h);
  return length(p) - r;
}
```

## Simple Tree

```glsl
// deep - number of tree levels
// height - tree height
// radius - tree radius
// number - the number of branches into which a tree is divided
float sd_tree(vec3 p, float deep, float height, float radius, float number) {
  float tree = sd_capsule(p, radius, height);
  for (float i = 0.0; i < deep; i++) {
    float repeat = repeat_angle(p.xz, number);
    p.y -= height;
    p.xz *= rotate(repeat + PI / number);
    p.xy *= rotate(PI / 3.5); 
    p = p.yxz;
    radius /= sqrt(number);
    height /= 1.4;
    float branch = sd_capsule(p, radius, height);
    tree = smin_root(tree, branch, 0.1);
  }
  return tree;
}
```

## A Little Better

```glsl
float sd_tree(vec3 p, float deep, float height, float radius, float number) {
  float tree = sd_capsule(p, radius, height);
  for (float i = 0.0; i < deep; i++) {
    p.xz *= rotate(PI / 4.0); // 
    float repeat = repeat_angle(p.xz, number);
    p.y -= height;
    p.xz *= rotate(repeat + PI / number);
    p.xy *= rotate(PI / 4.0 + 0.1 * i); // 
    p = p.yxz;
    radius /= sqrt(number);
    number += 1.0; // 
    height /= 1.5;
    float branch = sd_capsule(p, radius, height);
    tree = smin_root(tree, branch, 0.1);
  }
  return tree;
}
```

## Experiments

Distance function from [3D SDFs](https://iquilezles.org/articles/distfunctions/)

```glsl
float sd_round_cone(vec3 p, float r1, float r2, float h) {
  float b = (r1 - r2) / h;
  float a = sqrt(1.0 - b * b);
  vec2 q = vec2(length(p.xz), p.y);
  float k = dot(q, vec2(-b, a));
  if (k < 0.0) return length(q) - r1;
  if (k > a * h) return length(q - vec2(0.0, h)) - r2;
  return dot(q, vec2(a, b)) - r1;
}
```


```glsl
float sd_tree(vec3 p, float deep, float height, float radius, float number) {
  float tree = sd_round_cone(p, radius, 0.3 * radius, height);
  float branch_radius = radius / sqrt(number + 1.0);
  for (float i = 0.0; i < deep; i++) {
    p.xz *= rotate(PI / 3.0);
    p.y -= 0.8 * height / deep;
    vec3 q = p;
    float repeat = repeat_angle(q.xz, number);
    q.xz *= rotate(repeat);
    q.xy *= rotate(PI / 4.0); 
    float branch = sd_round_cone(q.yxz, branch_radius, 0.3 * branch_radius, 0.3 * height);
    tree = smin_root(tree, branch, 0.1);
  }
  return tree;
}
```