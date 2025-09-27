#include "common.frag"

#define EPSILON (0.001)

float sd_branch(vec3 p, float deep, float radius, float height, float number) {
  float branch = sd_round_cone(p, radius, 0.3 * radius, height);
  for (float i = 0.0; i < deep; i++) {
    p.xz *= rotate(PI / 4.0); // 
    float repeat = repeat_angle(p.xz, number);
    p.y -= 0.8 * height;
    p.xz *= rotate(repeat);
    p.xy *= rotate(PI / 4.0 + 0.1 * length(p.xz)); // 
    p = p.yxz;
    radius /= sqrt(number);
    height /= 1.5;
    float twig = sd_round_cone(p, radius, 0.3 * radius, height);
    branch = smin_root(twig, branch, 0.1);
  }
  return branch;
}


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

vec2 map(vec3 p) {
  p.xz *= rotate(iTime);
  float s = sd_tree(p, 3.0, 25.0, 1.0, 4.0);
  return vec2(s, 0.0);
}


// https://iquilezles.org/articles/normalsSDF/

vec3 get_normal(vec3 p) {
  const float h = 0.01; 
  const vec2 k = vec2(1.0, -1.0);
  return normalize(k.xyy * map(p + k.xyy * h).x + 
                   k.yyx * map(p + k.yyx * h).x + 
                   k.yxy * map(p + k.yxy * h).x + 
                   k.xxx * map(p + k.xxx * h).x);
}

Hit march(Ray ray, float near, float far, float step_size, int step_count) {
  Hit hit; 
  hit.id = -1.0;
  float t = near;
  for (int i = 0; i < step_count && t < far; i++) {
    vec3 p = ray.origin + ray.direction * t;
    vec2 d = map(p);
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

vec3 render(Ray ray) {
  vec3 color = vec3(0.0);
  Hit hit = march(ray, 0.0, 500.0, 0.5, 100);

  if (hit.id != -1.0) {
    color.x = max(dot(hit.normal, normalize(vec3(1.0))), 0.0) + 0.2;
  }

  return color;
}

void mainImage(out vec4 out_color, in vec2 in_position) {
  vec2 uv = (2.0 * in_position - iResolution.xy) / iResolution.x;
  vec3 color = vec3(0.0);

  vec3 origin = vec3(0.0, 15.0, 25.0);

  Ray ray;
  ray.origin = origin;
  ray.direction = normalize(vec3(uv, -1.0));

  color = render(ray);
  color = pow(color, vec3(1.0 / 2.2));

  out_color = vec4(color, 1.0);
}
