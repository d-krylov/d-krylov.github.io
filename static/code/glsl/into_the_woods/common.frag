#ifndef COMMON_FRAG
#define COMMON_FRAG

#define PI (3.14159265358979323)

struct Ray {
  vec3 origin;
  vec3 direction;
};

struct Hit {
  float id;
  vec3 position;
  vec3 normal;
};

float repeat_angle(vec2 p, float n) {
  float sp = 2.0 * PI / n;
  float an = atan(p.y, p.x);
  float id = round(an / sp);
  return sp * id;
}

mat2 rotate(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

float smin_root(float a, float b, float k) {
  float x = b - a;
  return 0.5 * (a + b - sqrt(x * x + 4.0 * k * k));
}

float sd_capsule(vec3 p, float r, float h) {
  p.y -= clamp(p.y, 0.0, h);
  return length(p) - r;
}

float sd_round_cone(vec3 p, float r1, float r2, float h) {
  float b = (r1 - r2) / h;
  float a = sqrt(1.0 - b * b);
  vec2 q = vec2(length(p.xz), p.y);
  float k = dot(q, vec2(-b, a));
  if (k < 0.0) return length(q) - r1;
  if (k > a * h) return length(q - vec2(0.0, h)) - r2;
  return dot(q, vec2(a, b)) - r1;
}

#endif // COMMON_FRAG