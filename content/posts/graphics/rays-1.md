+++
title = 'Rays and what they can'
date = '2024-12-21T20:23:08+04:00'
draft = true
math = true
summary = 'Introduction to raymarching'
tags = ["Graphics"]
+++

## Introduction

Мне нравится GLSL и все те штуки которые он позволяет создавать. Поэтому я решил создать блог, где могу поделиться своими идеями. 
Я полагаю, что самый популярный сайт, где люди могут поделиться своими шейдерами это [Shadertoy](https://www.shadertoy.com/).

В этом блоге я собираюсь писать о некоторых интересных для меня вещах. Одной из которых является компьютерная графика.
Большинство, если не все алгоритмы компютерной графики (и не только ее) можно реализовать на языке GLSL.

Некоторое вреия назад я начал разрабатывать библиотеку инструментов для удобного написания шейдеров. 

Для визуализации я использую очень удобный плагин [Shader Toy](https://marketplace.visualstudio.com/items?itemName=stevensona.shader-toy).
И моя библиотека заточена под него. 

## Raytracing and Raymarching



## Ray and Hit

`Ray` это структура содержащая всего два поля - позицию и направление камеры. Все функции принимающие `Ray` ожидают что 
вектор направления нормализован.

```glsl
struct Ray {
  vec3 origin;    // camera position
  vec3 direction; // normalized camera direction
};
```

`Hit` содержит всю необходимую информацию о точке взаимодействия луча с поверхностью. А именно - позицию, нормаль к поверхности,
находится ли луч внутри объекта и идентификатор объекта. 

```glsl
struct Hit {
  float id;       // Object identifier
  bool inside;    // Is ray inside object?
  vec3 normal;    // Normal to a surface
  vec3 position;  // position = ray.origin + ray.direction * t
};
```

Сама функция `march` выполняет трассировку луча от `near` до `far` с размером шага 
пропорциональным расстоянию до объекта. Цикл будет прерван, если превышено максимальное число шагов. `MAP` это макрос 
который должен быть определен пользователем, как функция возвращающая `vec2`. Первый компонент вектора это расстояние до ближайшего объекта,
а второй идентификатор этого объекта.

```glsl
Hit march(Ray ray, float near, float far, float step_size, int step_count) {
  Hit hit;
  hit.id = -1.0;
  float t = near;
  for (int i = 0; i < step_count && t < far; i++) {
    vec3 p = ray.origin + ray.direction * t;
    vec2 d = MAP(p);
    if (d.x < EPSILON) {
      hit.id = d.y;
      hit.position = p; 
      hit.normal = get_normal(hit.position);
      break;
    }
    t += step_size * d.x;
  }
  return hit;
}
```

And 

```glsl
// https://iquilezles.org/articles/normalsSDF/

vec3 get_normal(vec3 p) {
  const float h = 0.01; 
  const vec2 k = vec2(1.0, -1.0);
  return normalize(k.xyy * MAP(p + k.xyy * h).x + 
                   k.yyx * MAP(p + k.yyx * h).x + 
                   k.yxy * MAP(p + k.yxy * h).x + 
                   k.xxx * MAP(p + k.xxx * h).x);
}
```

## Example



## References

1. [Inigo Quilez](https://iquilezles.org/)
2. [Normals in Raymarching](https://iquilezles.org/articles/normalsSDF/)
3. Library [Shadertoy](https://github.com/d-krylov/Shadertoy)
4. [Basic Lighting](https://learnopengl.com/Lighting/Basic-Lighting)