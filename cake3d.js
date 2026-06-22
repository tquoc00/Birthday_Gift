// 3D Birthday Cake using Three.js
// Rotatable 360°, cuttable into pieces

window.initCake3D = function(addChatMessage, triggerConfetti, state) {
  const canvas = document.getElementById('cake-canvas-3d');
  const viewport = document.getElementById('cake-3d-viewport');
  if (!canvas || !viewport || !window.THREE) return;

  const THREE = window.THREE;
  let scene, camera, renderer, controls;
  let cakeGroup, candleFlame, candleLight;
  let cakePieces = [];
  let animId = null;
  let isExploded = false;

  function init() {
    scene = new THREE.Scene();
    scene.background = null; // transparent

    const w = viewport.clientWidth;
    const h = viewport.clientHeight;
    camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 4, 8);
    camera.lookAt(0, 1.2, 0);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // OrbitControls for 360 rotation
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 1.2, 0);
    controls.minDistance = 4;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.update();

    // Lights
    const ambient = new THREE.AmbientLight(0xffe5ec, 0.7);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(3, 6, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);
    const rimLight = new THREE.DirectionalLight(0xffb3c6, 0.4);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    // Plate
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.3 });
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.2, 0.15, 48), plateMat);
    plate.position.y = 0;
    plate.receiveShadow = true;
    scene.add(plate);

    // Build cake group
    cakeGroup = new THREE.Group();
    scene.add(cakeGroup);

    buildCake();
    buildCandle();

    animate();

    window.addEventListener('resize', onResize);
  }

  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xff85a1, roughness: 0.6 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xffb3c6, roughness: 0.5 });
  const darkPinkMat = new THREE.MeshStandardMaterial({ color: 0xff4d6d, roughness: 0.4 });
  const strawberryMat = new THREE.MeshStandardMaterial({ color: 0xff1744, roughness: 0.5 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x66bb6a, roughness: 0.6 });

  function buildCake() {
    // Bottom layer
    const bot = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.3, 1.0, 48), pinkMat);
    bot.position.y = 0.65;
    bot.castShadow = true;
    cakeGroup.add(bot);

    // Cream ring bottom
    const creamRing1 = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.08, 8, 48), whiteMat);
    creamRing1.position.y = 1.15;
    creamRing1.rotation.x = Math.PI / 2;
    cakeGroup.add(creamRing1);

    // Middle layer
    const mid = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.8, 0.8, 48), whiteMat);
    mid.position.y = 1.55;
    mid.castShadow = true;
    cakeGroup.add(mid);

    // Cream ring mid
    const creamRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.07, 8, 48), creamMat);
    creamRing2.position.y = 1.95;
    creamRing2.rotation.x = Math.PI / 2;
    cakeGroup.add(creamRing2);

    // Top layer
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.7, 48), pinkMat);
    top.position.y = 2.30;
    top.castShadow = true;
    cakeGroup.add(top);

    // Frosting drips on sides
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const drip = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.3, 4, 8), whiteMat);
      drip.position.set(Math.cos(angle) * 2.2, 0.7, Math.sin(angle) * 2.2);
      cakeGroup.add(drip);
    }
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + 0.2;
      const drip = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.25, 4, 8), creamMat);
      drip.position.set(Math.cos(angle) * 1.7, 1.45, Math.sin(angle) * 1.7);
      cakeGroup.add(drip);
    }

    // Strawberries on top
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r = 0.8;
      const strawberry = makeStrawberry();
      strawberry.position.set(Math.cos(angle) * r, 2.75, Math.sin(angle) * r);
      strawberry.scale.setScalar(0.3);
      cakeGroup.add(strawberry);
    }

    // Cream dollops on top
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const dollop = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), whiteMat);
      dollop.position.set(Math.cos(angle) * 0.9, 2.72, Math.sin(angle) * 0.9);
      dollop.scale.y = 0.7;
      cakeGroup.add(dollop);
    }
  }

  function makeStrawberry() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.7, 8), strawberryMat);
    body.rotation.x = Math.PI;
    body.position.y = 0.2;
    group.add(body);
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.15, 6), greenMat);
    leaf.position.y = 0.55;
    group.add(leaf);
    return group;
  }

  function buildCandle() {
    // Candle stick
    const candleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 12);
    const candleMat = new THREE.MeshStandardMaterial({ color: 0xffccd5, roughness: 0.4 });
    const candle = new THREE.Mesh(candleGeo, candleMat);
    candle.position.y = 3.05;
    cakeGroup.add(candle);

    // Wick
    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 6),
      new THREE.MeshStandardMaterial({ color: 0x333333 }));
    wick.position.y = 3.51;
    cakeGroup.add(wick);

    // Flame (hidden initially)
    const flameGeo = new THREE.ConeGeometry(0.06, 0.2, 8);
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xffd166, emissive: 0xff8800, emissiveIntensity: 2, transparent: true, opacity: 0.9
    });
    candleFlame = new THREE.Mesh(flameGeo, flameMat);
    candleFlame.position.y = 3.67;
    candleFlame.visible = false;
    cakeGroup.add(candleFlame);

    // Flame glow
    const glowGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00, emissive: 0xff6600, emissiveIntensity: 1.5, transparent: true, opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 3.62;
    glow.visible = false;
    candleFlame.userData.glow = glow;
    cakeGroup.add(glow);

    // Point light from candle
    candleLight = new THREE.PointLight(0xff8800, 0, 5);
    candleLight.position.y = 3.7;
    cakeGroup.add(candleLight);
  }

  // --- Actions ---
  window.cake3D_lightCandle = function() {
    if (!candleFlame) return;
    candleFlame.visible = true;
    candleFlame.userData.glow.visible = true;
    candleLight.intensity = 2;
    state.isCandleLit = true;

    document.getElementById('light-candle-btn').classList.add('hidden');
    document.getElementById('blow-candle-btn').classList.remove('hidden');
    document.getElementById('cake-instruction').textContent = "Hãy ước một điều và thổi tắt nến nhé! 💨";
    addChatMessage("Hệ thống", "Nến đã được thắp! 🔥", true);
    addChatMessage("Anh yêu", "Ước đi em rồi thổi tắt nến nào! 🌬️");
  };

  window.cake3D_blowCandle = function() {
    if (!candleFlame || !state.isCandleLit) return;
    candleFlame.visible = false;
    candleFlame.userData.glow.visible = false;
    candleLight.intensity = 0;
    state.isCandleBlown = true;

    document.getElementById('blow-candle-btn').classList.add('hidden');
    document.getElementById('cut-cake-btn').classList.remove('hidden');
    document.getElementById('cake-instruction').textContent = "Nến đã thổi tắt! Giờ hãy cắt bánh nhé! 🔪";

    triggerConfetti(viewport, 40, ['💖', '🌸', '✨', '🎀', '💝']);
    addChatMessage("Hệ thống", "Đã thổi tắt nến! 💨", true);
    addChatMessage("Anh yêu", "Hy vọng điều ước của em sẽ thành hiện thực! 🌟 Bây giờ hãy cắt bánh nào!");
  };

  window.cake3D_cutCake = function() {
    if (state.isCakeCut) return;
    state.isCakeCut = true;

    // Remove whole cake group children, create pie slices
    while (cakeGroup.children.length) {
      cakeGroup.remove(cakeGroup.children[0]);
    }

    const sliceCount = 8;
    cakePieces = [];

    for (let i = 0; i < sliceCount; i++) {
      const piece = createCakeSlice(i, sliceCount);
      cakePieces.push(piece);
      cakeGroup.add(piece);
    }

    document.getElementById('cut-cake-btn').classList.add('hidden');
    document.getElementById('explode-cake-btn').classList.remove('hidden');
    document.getElementById('cake-instruction').textContent = "Bánh đã cắt thành nhiều phần! 🍰 Thưởng thức thôi!";

    triggerConfetti(viewport, 25, ['🍓', '✨', '🍰']);
    addChatMessage("Hệ thống", "Đã cắt bánh! 🍰", true);
    addChatMessage("Anh yêu", "Những lát bánh thật đẹp! Nhấp Ăn Bánh để xem điều kỳ diệu! 🎉");
  };

  function createCakeSlice(index, total) {
    const group = new THREE.Group();
    const angleStart = (index / total) * Math.PI * 2;
    const angleEnd = ((index + 1) / total) * Math.PI * 2;

    // Bottom layer slice
    const botGeo = createSliceGeometry(2.2, 2.3, 1.0, angleStart, angleEnd, 16);
    const bot = new THREE.Mesh(botGeo, pinkMat.clone());
    bot.position.y = 0.65;
    bot.castShadow = true;
    group.add(bot);

    // Middle layer slice
    const midGeo = createSliceGeometry(1.7, 1.8, 0.8, angleStart, angleEnd, 16);
    const mid = new THREE.Mesh(midGeo, whiteMat.clone());
    mid.position.y = 1.55;
    mid.castShadow = true;
    group.add(mid);

    // Top layer slice
    const topGeo = createSliceGeometry(1.2, 1.3, 0.7, angleStart, angleEnd, 16);
    const top = new THREE.Mesh(topGeo, pinkMat.clone());
    top.position.y = 2.30;
    top.castShadow = true;
    group.add(top);

    // Cross-section face (cream visible)
    const faceGeo = new THREE.PlaneGeometry(2.3, 2.5);
    const faceMat = new THREE.MeshStandardMaterial({ color: 0xf7d6e0, roughness: 0.6, side: THREE.DoubleSide });
    const face1 = new THREE.Mesh(faceGeo, faceMat);
    face1.position.y = 1.4;
    face1.rotation.y = angleStart;
    face1.position.x = Math.sin(angleStart) * 0.01;
    face1.position.z = Math.cos(angleStart) * 0.01;
    group.add(face1);

    // Strawberry on top of slice
    const straw = makeStrawberry();
    const midAngle = (angleStart + angleEnd) / 2;
    straw.position.set(Math.cos(midAngle) * 0.7, 2.75, Math.sin(midAngle) * 0.7);
    straw.scale.setScalar(0.25);
    group.add(straw);

    // Store target for explosion
    group.userData.explodeDir = new THREE.Vector3(
      Math.cos((angleStart + angleEnd) / 2),
      0.5 + Math.random() * 0.5,
      Math.sin((angleStart + angleEnd) / 2)
    );
    group.userData.explodeRot = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );

    return group;
  }

  function createSliceGeometry(radiusTop, radiusBottom, height, thetaStart, thetaEnd, segments) {
    const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments, 1, false, thetaStart, thetaEnd - thetaStart);
    return geo;
  }

  window.cake3D_explode = function() {
    if (isExploded) return;
    isExploded = true;

    cakePieces.forEach((piece, i) => {
      const dir = piece.userData.explodeDir;
      const rot = piece.userData.explodeRot;
      const dist = 2 + Math.random() * 2;
      const delay = i * 0.08;

      gsap.to(piece.position, {
        x: dir.x * dist,
        y: dir.y * dist + 1,
        z: dir.z * dist,
        duration: 1.2,
        delay: delay,
        ease: "back.out(1.5)"
      });
      gsap.to(piece.rotation, {
        x: rot.x * 3,
        y: rot.y * 3,
        z: rot.z * 3,
        duration: 1.5,
        delay: delay,
        ease: "power2.out"
      });
    });

    document.getElementById('explode-cake-btn').classList.add('hidden');
    const toVideoBtn = document.getElementById('to-video-btn');
    toVideoBtn.classList.remove('hidden');
    gsap.fromTo(toVideoBtn, { scale: 0 }, { scale: 1, duration: 0.5, delay: 0.5, ease: "back.out(1.5)" });
    document.getElementById('cake-instruction').textContent = "Chúc em ngon miệng! 🎂💖";

    triggerConfetti(viewport, 50, ['💖', '🎂', '✨', '🎀', '🍓', '🧁']);
    addChatMessage("Anh yêu", "Ngon quá! Giờ thì xem video thôi nào! 🎬");
  };

  window.cake3D_reset = function() {
    isExploded = false;
    cakePieces = [];
    while (cakeGroup.children.length) cakeGroup.remove(cakeGroup.children[0]);
    buildCake();
    buildCandle();

    ['light-candle-btn'].forEach(id => document.getElementById(id)?.classList.remove('hidden'));
    ['blow-candle-btn', 'cut-cake-btn', 'explode-cake-btn', 'to-video-btn'].forEach(id =>
      document.getElementById(id)?.classList.add('hidden'));
    document.getElementById('cake-instruction').textContent = "Kéo để xoay bánh 360° • Bấm \"Thắp Nến\" để bắt đầu! 🕯️";
  };

  function onResize() {
    if (!viewport || !renderer || !camera) return;
    const w = viewport.clientWidth;
    const h = viewport.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.cake3D_resize = onResize;

  function animate() {
    animId = requestAnimationFrame(animate);
    controls.update();

    // Flame flicker
    if (candleFlame && candleFlame.visible) {
      candleFlame.scale.x = 1 + Math.sin(Date.now() * 0.015) * 0.15;
      candleFlame.scale.z = 1 + Math.cos(Date.now() * 0.012) * 0.15;
      candleFlame.scale.y = 1 + Math.sin(Date.now() * 0.02) * 0.1;
      candleFlame.rotation.y += 0.02;
    }

    renderer.render(scene, camera);
  }

  init();
};
