/* ==========================================================================
   ATLAS ODYSSEY - AESTHETIC 3D INTERACTIVE THREE.JS GLOBE
   Themes: Beige, Aqua Blue, and Pink Accents
   ========================================================================== */

const AestheticGlobe = (() => {
    let scene, camera, renderer;
    let globeMesh, atmosphereMesh, cloudsMesh;
    let pointsGroup, ringsGroup, starsGroup;
    let container;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotationVelocity = { x: 0.001, y: 0.002 };
    let animId;

    // Major world cultural landmarks coordinates for pulsating pin beacons
    // [lat, lng, label, color]
    const beaconLocations = [
        [35.6762, 139.6503, "Tokyo", "#0097a7"],
        [48.8566, 2.3522, "Paris", "#d4456a"],
        [28.6139, 77.2090, "New Delhi", "#0097a7"],
        [-22.9068, -43.1729, "Rio de Janeiro", "#d4456a"],
        [30.0444, 31.2357, "Cairo", "#c0915e"],
        [40.7128, -74.0060, "New York", "#0097a7"],
        [-33.8688, 151.2093, "Sydney", "#d4456a"],
        [39.9042, 116.4074, "Beijing", "#0097a7"],
        [51.5074, -0.1278, "London", "#c0915e"],
        [-13.1631, -72.5450, "Machu Picchu", "#d4456a"],
        [41.9028, 12.4964, "Rome", "#0097a7"],
        [-1.2921, 36.8219, "Nairobi", "#d4456a"],
        [64.1466, -21.9426, "Reykjavík", "#0097a7"],
        [13.7563, 100.5018, "Bangkok", "#c0915e"]
    ];

    function latLngToVector3(lat, lng, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        return new THREE.Vector3(x, y, z);
    }

    function init() {
        container = document.querySelector('.globe-viewport');
        if (!container || typeof THREE === 'undefined') return;

        // Clear existing static fallback elements
        container.innerHTML = '';
        const width = container.clientWidth || 460;
        const height = container.clientHeight || 460;

        // Scene, Camera, Renderer
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.z = 240;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // 1. Core Sphere (Deep Warm Charcoal/Slate Base)
        const radius = 80;
        const sphereGeo = new THREE.SphereGeometry(radius, 64, 64);
        const sphereMat = new THREE.MeshPhongMaterial({
            color: 0x1b2838,
            emissive: 0x0f1822,
            specular: 0x26c6da,
            shininess: 25,
            wireframe: false
        });
        globeMesh = new THREE.Mesh(sphereGeo, sphereMat);
        scene.add(globeMesh);

        // 2. Latitude & Longitude Meridian Grid Rings in Warm Beige & Aqua
        const gridGeo = new THREE.WireframeGeometry(new THREE.SphereGeometry(radius + 0.5, 24, 16));
        const gridMat = new THREE.LineBasicMaterial({
            color: 0xc0915e,
            transparent: true,
            opacity: 0.22
        });
        const gridLines = new THREE.LineSegments(gridGeo, gridMat);
        globeMesh.add(gridLines);

        // 3. Glowing Atmospheric Halo (Custom Aqua & Pink Shader)
        const atmosphereGeo = new THREE.SphereGeometry(radius + 14, 64, 64);
        const vertexShader = `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        const fragmentShader = `
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                // Blend Aqua (#0097a7) and Pink (#d4456a)
                vec3 aqua = vec3(0.0, 0.592, 0.655);
                vec3 pink = vec3(0.831, 0.271, 0.416);
                vec3 glow = mix(aqua, pink, vNormal.y * 0.5 + 0.5);
                gl_FragColor = vec4(glow, intensity * 0.8);
            }
        `;
        const atmosphereMat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        });
        atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
        scene.add(atmosphereMesh);

        // 4. Celestial Orbital Rings (Aesthetic Beige & Rose Gold)
        ringsGroup = new THREE.Group();
        const ringGeo = new THREE.RingGeometry(radius + 22, radius + 23.5, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xc0915e,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.45
        });
        const orbitRing = new THREE.Mesh(ringGeo, ringMat);
        orbitRing.rotation.x = Math.PI / 2.5;
        orbitRing.rotation.y = Math.PI / 6;
        ringsGroup.add(orbitRing);

        const outerRingGeo = new THREE.RingGeometry(radius + 36, radius + 37, 64);
        const outerRingMat = new THREE.MeshBasicMaterial({
            color: 0x0097a7,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });
        const outerOrbitRing = new THREE.Mesh(outerRingGeo, outerRingMat);
        outerOrbitRing.rotation.x = Math.PI / 1.8;
        outerOrbitRing.rotation.z = Math.PI / 4;
        ringsGroup.add(outerOrbitRing);

        scene.add(ringsGroup);

        // 5. Pulsating Cultural Beacon Pins
        pointsGroup = new THREE.Group();
        beaconLocations.forEach(([lat, lng, name, hexColor]) => {
            const pos = latLngToVector3(lat, lng, radius + 0.8);
            
            // Pin base dot
            const dotGeo = new THREE.SphereGeometry(1.4, 16, 16);
            const dotMat = new THREE.MeshBasicMaterial({ color: hexColor });
            const dot = new THREE.Mesh(dotGeo, dotMat);
            dot.position.copy(pos);
            pointsGroup.add(dot);

            // Pulsing ring
            const pulseGeo = new THREE.RingGeometry(1.6, 2.5, 16);
            const pulseMat = new THREE.MeshBasicMaterial({
                color: hexColor,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.6
            });
            const pulse = new THREE.Mesh(pulseGeo, pulseMat);
            pulse.position.copy(pos.clone().multiplyScalar(1.01));
            pulse.lookAt(new THREE.Vector3(0, 0, 0));
            pointsGroup.add(pulse);

            // Radiant pillar beam
            const beamGeo = new THREE.CylinderGeometry(0.2, 0.4, 6, 8);
            const beamMat = new THREE.MeshBasicMaterial({
                color: hexColor,
                transparent: true,
                opacity: 0.5
            });
            const beam = new THREE.Mesh(beamGeo, beamMat);
            beam.position.copy(pos.clone().multiplyScalar(1.035));
            beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
            pointsGroup.add(beam);
        });
        globeMesh.add(pointsGroup);

        // 6. Floating Cosmic Star Dust Particles (Aqua, Pink, Beige)
        const starsGeo = new THREE.BufferGeometry();
        const starsCount = 180;
        const positions = new Float32Array(starsCount * 3);
        const colors = new Float32Array(starsCount * 3);

        const palette = [
            new THREE.Color('#0097a7'),
            new THREE.Color('#d4456a'),
            new THREE.Color('#c0915e'),
            new THREE.Color('#26c6da')
        ];

        for (let i = 0; i < starsCount; i++) {
            const dist = radius + 30 + Math.random() * 80;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = dist * Math.cos(phi);

            const c = palette[Math.floor(Math.random() * palette.length)];
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starsMat = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.7
        });
        starsGroup = new THREE.Points(starsGeo, starsMat);
        scene.add(starsGroup);

        // 7. Lighting
        const ambientLight = new THREE.AmbientLight(0xf5ede0, 1.1);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0x0097a7, 1.4);
        dirLight.position.set(150, 80, 120);
        scene.add(dirLight);

        const pinkLight = new THREE.DirectionalLight(0xd4456a, 1.2);
        pinkLight.position.set(-150, -80, -100);
        scene.add(pinkLight);

        // Setup Mouse / Touch Dragging
        setupInteractions();

        // Animation Loop
        animate();

        // Window resize
        window.addEventListener('resize', onWindowResize);
    }

    function setupInteractions() {
        const dom = renderer.domElement;

        dom.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            rotationVelocity.y = deltaX * 0.005;
            rotationVelocity.x = deltaY * 0.005;

            globeMesh.rotation.y += rotationVelocity.y;
            globeMesh.rotation.x += rotationVelocity.x;

            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Touch support
        dom.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isDragging = true;
                previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        });

        window.addEventListener('touchmove', (e) => {
            if (!isDragging || e.touches.length !== 1) return;
            const deltaX = e.touches[0].clientX - previousMousePosition.x;
            const deltaY = e.touches[0].clientY - previousMousePosition.y;

            rotationVelocity.y = deltaX * 0.005;
            rotationVelocity.x = deltaY * 0.005;

            globeMesh.rotation.y += rotationVelocity.y;
            globeMesh.rotation.x += rotationVelocity.x;

            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        });

        window.addEventListener('touchend', () => {
            isDragging = false;
        });
    }

    function animate() {
        animId = requestAnimationFrame(animate);

        // Smooth idle rotation with inertia decay
        if (!isDragging) {
            rotationVelocity.x *= 0.95;
            rotationVelocity.y *= 0.95;

            globeMesh.rotation.y += 0.0025 + rotationVelocity.y;
            globeMesh.rotation.x += rotationVelocity.x;
        }

        // Slow orbital rotation
        if (ringsGroup) {
            ringsGroup.rotation.z += 0.001;
        }

        // Slow cosmic stars rotation
        if (starsGroup) {
            starsGroup.rotation.y += 0.0005;
        }

        renderer.render(scene, camera);
    }

    function onWindowResize() {
        if (!container || !renderer || !camera) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    return {
        init
    };
})();

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Delay slightly to ensure fonts and layout calculate
    setTimeout(() => {
        AestheticGlobe.init();
    }, 200);
});

window.AestheticGlobe = AestheticGlobe;

