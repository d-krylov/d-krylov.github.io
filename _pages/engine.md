---
layout: canvas
permalink: /engine/
usemathjax: true
usethreejs: true
---

  <section class="hero mt-5">

    <div class="hero-body">
      <div class="columns">
      
        <div class="column">
          <textarea class = "textarea has-fixed-size" id="shaderInput" rows="30" type = "text" placeholder = "Enter your input"></textarea>
          <button id="applyShader" class="button is-primary mt-5">Apply Shader</button>
        </div>
        
        <div class="column">
          <canvas id="shaderCanvas"></canvas>
        </div>

      </div>      
    </div>
  
    
  </section>




<script src="/js/shadertoy.js"></script>