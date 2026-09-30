/* ============================================================
   3D 마시멜로우 시리얼볼 (Cereal Bowl) - Interactive Engine
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  init3DCerealBowl();
  initSpoonSwirlCanvas();
  initCerealBoxEnding();
  initToastAndCopy();
});

/* ============================================================
   1. SECTION 1: 3D CEREAL BOWL & MILK SPLASH
   ============================================================ */
function init3DCerealBowl() {
  const container = document.getElementById('bowl-box');
  const canvas = document.getElementById('bowl-canvas');
  if (!container || !canvas || typeof THREE === 'undefined') return;

  const width = container.clientWidth || 860;
  const height = container.clientHeight || 480;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
  camera.position.set(0, 5.2, 9.5);
  camera.lookAt(0, 0.4, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Soft Warm Studio Lighting
  const ambientLight = new THREE.AmbientLight(0xfff8f5, 1.2);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffeff4, 1.5);
  keyLight.position.set(6, 12, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  scene.add(keyLight);

  const blueRim = new THREE.DirectionalLight(0xbce6ff, 0.9);
  blueRim.position.set(-6, 8, -5);
  scene.add(blueRim);

  const bowlGroup = new THREE.Group();
  scene.add(bowlGroup);

  // 1) Ceramic Pastel Cereal Bowl
  const bowlGeo = new THREE.CylinderGeometry(4.2, 2.5, 2.4, 64, 1, true);
  const bowlMat = new THREE.MeshStandardMaterial({
    color: 0xE8F4FA,
    roughness: 0.15,
    metalness: 0.1,
    side: THREE.DoubleSide
  });
  const bowlMesh = new THREE.Mesh(bowlGeo, bowlMat);
  bowlMesh.position.y = 0;
  bowlMesh.receiveShadow = true;
  bowlGroup.add(bowlMesh);

  // Bowl Rim
  const rimGeo = new THREE.TorusGeometry(4.2, 0.15, 24, 64);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xD7EAF5, roughness: 0.1 });
  const bowlRim = new THREE.Mesh(rimGeo, rimMat);
  bowlRim.rotation.x = Math.PI / 2;
  bowlRim.position.y = 1.2;
  bowlGroup.add(bowlRim);

  // 2) Creamy White Milk Surface
  const milkGeo = new THREE.CircleGeometry(3.9, 64);
  const milkMat = new THREE.MeshStandardMaterial({
    color: 0xFFFDF9,
    roughness: 0.1,
    metalness: 0.05
  });
  const milkSurface = new THREE.Mesh(milkGeo, milkMat);
  milkSurface.rotation.x = -Math.PI / 2;
  milkSurface.position.y = 0.7;
  milkSurface.receiveShadow = true;
  bowlGroup.add(milkSurface);

  // 3) Milk Ripple Rings (expanding waves when marshmallows hit milk)
  const ripples = [];
  for (let i = 0; i < 4; i++) {
    const rippleGeo = new THREE.RingGeometry(0.1, 0.18, 32);
    const rippleMat = new THREE.MeshBasicMaterial({
      color: 0xF0E8E2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    const ring = new THREE.Mesh(rippleGeo, rippleMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.71;
    bowlGroup.add(ring);
    ripples.push({ mesh: ring, expanding: false, scale: 0.1, opacity: 0 });
  }

  // 4) 4 Chubby Bouncy Marshmallow Pieces Hovering & Dropping
  const mallowData = [
    { color: 0xFFC5D3, name: '은진', x: -1.6, z: 0.6, dropDelay: 0.08 },
    { color: 0xBCE6FF, name: '수연', x: 1.4, z: -0.7, dropDelay: 0.28 },
    { color: 0xFFF5A5, name: '한서', x: 0.6, z: 1.5, dropDelay: 0.48 },
    { color: 0xFFFFFF, name: '나연', x: -0.8, z: -1.4, dropDelay: 0.68 }
  ];

  const marshmallows = [];

  mallowData.forEach((m, idx) => {
    const mallowG = new THREE.Group();

    // Chubby Cylinder Body
    const cylGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.75, 32);
    const mMat = new THREE.MeshStandardMaterial({
      color: m.color,
      roughness: 0.35,
      metalness: 0.08
    });
    const cyl = new THREE.Mesh(cylGeo, mMat);
    cyl.castShadow = true;
    mallowG.add(cyl);

    // Rounded Caps
    const capGeo = new THREE.SphereGeometry(0.54, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const topCap = new THREE.Mesh(capGeo, mMat);
    topCap.position.y = 0.37;
    topCap.castShadow = true;
    mallowG.add(topCap);

    const botCap = new THREE.Mesh(capGeo, mMat);
    botCap.rotation.x = Math.PI;
    botCap.position.y = -0.37;
    botCap.castShadow = true;
    mallowG.add(botCap);

    // Initial Position (Hovering high above milk)
    mallowG.position.set(m.x, 3.8 + idx * 0.4, m.z);
    mallowG.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4);

    bowlGroup.add(mallowG);
    marshmallows.push({
      group: mallowG,
      initialY: 3.8 + idx * 0.4,
      targetY: 0.85, // Floating gently on milk surface
      x: m.x,
      z: m.z,
      dropDelay: m.dropDelay,
      hasSplashed: false
    });
  });

  // Scroll Progress controls dropping marshmallows into milk
  let scrollProgress = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    scrollProgress = Math.min(Math.max(scrollY / 450, 0), 1);
  });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // Gentle bowl breathing tilt
    bowlGroup.rotation.y = Math.sin(time * 0.5) * 0.06;

    // Marshmallows dropping with bouncy physics
    marshmallows.forEach((m, i) => {
      const dropThreshold = m.dropDelay;
      if (scrollProgress > dropThreshold) {
        const localT = Math.min((scrollProgress - dropThreshold) / 0.3, 1);
        // EaseOutBounce formula
        const currentY = m.initialY + (m.targetY - m.initialY) * easeOutBounce(localT);
        m.group.position.y = currentY + (localT >= 1 ? Math.sin(time * 2.2 + i) * 0.06 : 0);

        // Milk ripple trigger
        if (localT > 0.6 && !m.hasSplashed) {
          m.hasSplashed = true;
          ripples[i].expanding = true;
          ripples[i].mesh.position.x = m.x;
          ripples[i].mesh.position.z = m.z;
          ripples[i].scale = 0.2;
          ripples[i].opacity = 0.8;
        }
      } else {
        m.hasSplashed = false;
        m.group.position.y = m.initialY + Math.sin(time * 1.8 + i) * 0.1;
      }
    });

    // Ripple expanding update
    ripples.forEach((r) => {
      if (r.expanding) {
        r.scale += 0.08;
        r.opacity -= 0.02;
        r.mesh.scale.set(r.scale, r.scale, r.scale);
        r.mesh.material.opacity = Math.max(r.opacity, 0);
        if (r.opacity <= 0) {
          r.expanding = false;
        }
      }
    });

    renderer.render(scene, camera);
  }
  animate();

  function easeOutBounce(x) {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (x < 1 / d1) {
      return n1 * x * x;
    } else if (x < 2 / d1) {
      return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
      return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
      return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
  }

  window.addEventListener('resize', () => {
    const newW = container.clientWidth;
    const newH = container.clientHeight;
    camera.aspect = newW / newH;
    camera.updateProjectionMatrix();
    renderer.setSize(newW, newH);
  });
}

/* ============================================================
   2. SECTION 2: BRAND STORY - SPOON SWIRLING CANVAS
   ============================================================ */
function initSpoonSwirlCanvas() {
  const canvas = document.getElementById('spoon-canvas');
  const section = document.getElementById('story');
  if (!canvas || !section) return;

  const ctx = canvas.getContext('2d');
  let progress = 0;

  function resize() {
    canvas.width = canvas.parentElement.clientWidth * window.devicePixelRatio || 820;
    canvas.height = 380 * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  resize();
  window.addEventListener('resize', resize);

  const marshmallows = [
    { color: '#FFC5D3', shadow: '#E297AA', angle: 0 },
    { color: '#BCE6FF', shadow: '#89CEFC', angle: Math.PI * 0.5 },
    { color: '#FFF5A5', shadow: '#DFD27C', angle: Math.PI },
    { color: '#FFFFFF', shadow: '#DDD9E8', angle: Math.PI * 1.5 }
  ];

  function drawScene(p) {
    const w = canvas.width / window.devicePixelRatio;
    const h = 380;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Creamy Milk Basin Circle
    const basinR = 150;
    const milkGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, basinR);
    milkGrad.addColorStop(0, '#FFFFFF');
    milkGrad.addColorStop(0.7, '#FAF8F5');
    milkGrad.addColorStop(1, '#EBF4FA');

    ctx.fillStyle = milkGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, basinR, 0, Math.PI * 2);
    ctx.fill();

    // Soft Basin Shadow
    ctx.strokeStyle = '#D9E8F2';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Swirling Milk Waves
    const swirlAngle = p * Math.PI * 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    for (let r = 40; r < 130; r += 35) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, swirlAngle, swirlAngle + Math.PI * 1.2);
      ctx.stroke();
    }

    // 4 Swirling Marshmallows orbiting in milk
    const orbitR = 85;
    marshmallows.forEach((m) => {
      const curAngle = m.angle + swirlAngle;
      const mx = cx + Math.cos(curAngle) * orbitR;
      const my = cy + Math.sin(curAngle) * (orbitR * 0.7);

      // Marshmallow Pill shape
      ctx.shadowColor = 'rgba(180, 160, 180, 0.25)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 8;

      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.roundRect(mx - 24, my - 18, 48, 36, 14);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Soft Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.roundRect(mx - 18, my - 14, 36, 10, 6);
      ctx.fill();
    });

    // 3D Silver Spoon dipping and stirring
    const spoonX = cx + Math.cos(swirlAngle + 1.2) * 50;
    const spoonY = cy + Math.sin(swirlAngle + 1.2) * 35;

    // Spoon Handle & Head
    ctx.save();
    ctx.translate(spoonX, spoonY);
    ctx.rotate(0.3 + Math.sin(swirlAngle) * 0.15);

    // Spoon Bowl
    const spGrad = ctx.createLinearGradient(-25, -35, 25, 35);
    spGrad.addColorStop(0, '#FFFFFF');
    spGrad.addColorStop(0.5, '#E4E7EE');
    spGrad.addColorStop(1, '#C2C7D4');

    ctx.fillStyle = spGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spoon Handle
    ctx.fillStyle = '#D6DAE5';
    ctx.fillRect(-6, -140, 12, 110);
    ctx.restore();
  }

  window.addEventListener('scroll', () => {
    const rect = section.getBoundingClientRect();
    const windowH = window.innerHeight;
    if (rect.top < windowH && rect.bottom > 0) {
      progress = Math.min(Math.max((windowH - rect.top) / (windowH + rect.height), 0), 1);
      drawScene(progress);
    }
  });

  drawScene(0);
}

/* ============================================================
   3. SECTION 5: CEREAL BOX ENDING - 4 MALLOWS HOPPING IN
   ============================================================ */
function initCerealBoxEnding() {
  const endingSec = document.getElementById('ending');
  const box = document.getElementById('cereal-box-target');
  const stamp = document.getElementById('complete-stamp');
  const drawer = document.getElementById('contacts-drawer');
  const hoppingMallows = document.querySelectorAll('.hopping-mallow');

  if (!endingSec || !box || !stamp) return;

  let hasAnimated = false;

  window.addEventListener('scroll', () => {
    const rect = endingSec.getBoundingClientRect();
    const windowH = window.innerHeight;

    // Trigger when ending section reaches view center
    if (rect.top < windowH * 0.65 && !hasAnimated) {
      hasAnimated = true;

      // 4 Marshmallows hop sequentially into the box: 쏙! 쏙! 쏙! 쏙!
      hoppingMallows.forEach((mallow, idx) => {
        setTimeout(() => {
          mallow.classList.add('in-box');
        }, idx * 250);
      });

      // Box lid closes & Stamp slams down!
      setTimeout(() => {
        stamp.classList.add('stamped');
        box.classList.add('bounce-box');
        showToast('🎉 4색 마시멜로우가 상자 속에 쏙! 시리얼 완성!');
      }, 1200);
    }
  });

  // Clicking the completed box opens the contact drawer
  box.addEventListener('click', () => {
    box.classList.remove('bounce-box');
    void box.offsetWidth;
    box.classList.add('bounce-box');

    if (drawer) {
      drawer.classList.toggle('open');
      if (drawer.classList.contains('open')) {
        showToast('📬 팀원 연락처가 열렸습니다!');
      }
    }
  });
}

/* ============================================================
   4. TOAST & CLIPBOARD COPY UTILITIES
   ============================================================ */
let toastTimer = null;
function showToast(msg) {
  let toast = document.getElementById('toast-msg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-msg';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function initToastAndCopy() {
  const copyBtns = document.querySelectorAll('.c-copy-btn');
  copyBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const val = btn.getAttribute('data-copy');
      if (navigator.clipboard && val) {
        navigator.clipboard.writeText(val).then(() => {
          showToast(`📋 ${val} 복사되었습니다!`);
        });
      }
    });
  });
}
