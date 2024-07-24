const scene = new THREE.Scene();
const camera = new THREE.Camera();
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('shaderCanvas') });



const fragmentShader = `
  uniform vec2 iResolution;
  uniform float iTime;

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution;
            vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));
            fragColor = vec4(col, 1.0);
        }

        void main() {
            mainImage(gl_FragColor, gl_FragCoord.xy);
        }
`;

const vertexShader = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const material = new THREE.ShaderMaterial({
  uniforms: {
    iResolution: { value: new THREE.Vector2(800.0, 600.0) },
    iTime: { value: 0.0 }
  },
  vertexShader,
  fragmentShader
});

const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

function animate() {
  requestAnimationFrame(animate);
  material.uniforms.iTime.value += 0.05;
  renderer.render(scene, camera);
}

animate();

document.getElementById('applyShader').addEventListener('click', () => {
  const shaderInput = document.getElementById('shaderInput').value;
  if (shaderInput) {
    material.fragmentShader = shaderInput;
    material.needsUpdate = true;
  }
});
