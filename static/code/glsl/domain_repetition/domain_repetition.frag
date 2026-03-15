#include "common.frag"

vec2 map(vec3 p) {
  //p.yz *= rotate(0.5);
  float t = sd_helix(p, 1.0, 2.0, 2.0, 0.25);
  return vec2(t, 0.0);
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
  Hit hit = march(ray, 0.0, 500.0, 0.5, 1000);

  vec3 sun = normalize(vec3(1.0));
  if (hit.id != -1.0) {
    vec3 albedo = vec3(0.1, 0.2, 0.1);
    float NdotL = max(dot(hit.normal, sun), 0.0);
    color = albedo + vec3(0.5, 0.5, 0.5) * NdotL;
  }

  return color;
}

void mainImage(out vec4 out_color, in vec2 in_position) {
  vec2 uv = (2.0 * in_position - iResolution.xy) / iResolution.x;
  vec3 color = vec3(0.0);

  vec3 origin = vec3(0.0, 0.0, 10.0);

  Ray ray;
  ray.origin = origin;
  ray.direction = normalize(vec3(uv, -1.0));

  color = render(ray);
  color = pow(color, vec3(1.0 / 2.2));

  out_color = vec4(color, 1.0);
}