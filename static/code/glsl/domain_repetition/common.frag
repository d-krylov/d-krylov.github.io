#ifndef COMMON_FRAG
#define COMMON_FRAG

const float PI = 3.14159265358979323;
const float EPSILON = 0.001;

struct Ray {
  vec3 origin;
  vec3 direction;
};

struct Hit {
  float id;
  vec3 position;
  vec3 normal;
};

mat2 rotate(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

float sd_torus( vec3 p, float R, float r) {
  vec2 q = vec2(length(p.xz) - R, p.y);
  return length(q) - r;
}

float sd_helix(vec3 p, float order, float wraps, float R, float r) {
  float l = length(p.xz) - R;
  float n = 2.0 * PI;
  float y = order * atan(p.z, p.x) - wraps * p.y;
  float id = n * round(y / n);
  float d = y - id;
  return length(vec2(l, d)) - r;
}

#endif // COMMON_FRAG