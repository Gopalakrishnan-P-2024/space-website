let scene, camera, renderer, planets = [], orbitLines = [];
let isPaused = false;
let orbitSpeed = 1;
let raycaster, mouse;

const solarSystem = [
    { name: "Sun", radius: 10, color: 0xFFFF00, orbitRadius: 0, rotationSpeed: 0.002 },
    { name: "Mercury", radius: 0.38, color: 0x8B8B8B, orbitRadius: 20, rotationSpeed: 0.005 },
    { name: "Venus", radius: 0.95, color: 0xFFA500, orbitRadius: 30, rotationSpeed: 0.004 },
    { name: "Earth", radius: 1, color: 0x0000FF, orbitRadius: 40, rotationSpeed: 0.003 },
    { name: "Mars", radius: 0.53, color: 0xFF0000, orbitRadius: 50, rotationSpeed: 0.0025 },
    { name: "Jupiter", radius: 11.2, color: 0xFFA500, orbitRadius: 70, rotationSpeed: 0.001 },
    { name: "Saturn", radius: 9.45, color: 0xFFD700, orbitRadius: 90, rotationSpeed: 0.0009 },
    { name: "Uranus", radius: 4, color: 0x00FFFF, orbitRadius: 110, rotationSpeed: 0.0007 },
    { name: "Neptune", radius: 3.88, color: 0x0000FF, orbitRadius: 130, rotationSpeed: 0.0005 },
];

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 100;

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('solar-system'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xFFFFFF, 2, 300);
    scene.add(pointLight);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    solarSystem.forEach(createPlanet);
    createStarfield();

    animate();
}

function createPlanet(planetData) {
    const geometry = new THREE.SphereGeometry(planetData.radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: planetData.color });
    const planet = new THREE.Mesh(geometry, material);
    
    planet.position.x = planetData.orbitRadius;
    
    const planetObj = { 
        mesh: planet, 
        orbitRadius: planetData.orbitRadius, 
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: planetData.rotationSpeed,
        name: planetData.name
    };
    planets.push(planetObj);
    scene.add(planet);

    // Add orbit line
    const orbitGeometry = new THREE.RingGeometry(planetData.orbitRadius - 0.1, planetData.orbitRadius + 0.1, 128);
    const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    const orbitLine = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbitLine.rotation.x = Math.PI / 2;
    scene.add(orbitLine);
    orbitLines.push(orbitLine);

    // Add label
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = 'bold 32px Arial';
    context.fillStyle = 'white';
    context.fillText(planetData.name, 0, 32);
    const texture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({ map: texture });
    const label = new THREE.Sprite(labelMaterial);
    label.position.set(planetData.orbitRadius, planetData.radius + 2, 0);
    label.scale.set(10, 5, 1);
    planetObj.label = label;
    scene.add(label);
}

function createStarfield() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    for (let i = 0; i < 10000; i++) {
        vertices.push(
            Math.random() * 600 - 300,
            Math.random() * 600 - 300,
            Math.random() * 600 - 300
        );
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.5 });
    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
}

function animate() {
    requestAnimationFrame(animate);

    TWEEN.update();

    if (!isPaused) {
        planets.forEach(planet => {
            if (planet.orbitRadius !== 0) {  // Don't move the Sun
                planet.angle += 0.01 * orbitSpeed * (30 / planet.orbitRadius);
                planet.mesh.position.x = Math.cos(planet.angle) * planet.orbitRadius;
                planet.mesh.position.z = Math.sin(planet.angle) * planet.orbitRadius;
                if (planet.label) {
                    planet.label.position.x = planet.mesh.position.x;
                    planet.label.position.z = planet.mesh.position.z;
                }
            }
            planet.mesh.rotation.y += planet.rotationSpeed;
        });
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

    if (intersects.length > 0) {
        const planetInfo = document.getElementById('planet-info');
        const planet = planets.find(p => p.mesh === intersects[0].object);
        planetInfo.innerHTML = `<h2>${planet.name}</h2>
                                <p>Orbit Radius: ${planet.orbitRadius}</p>
                                <p>Rotation Speed: ${planet.rotationSpeed}</p>`;
        planetInfo.style.display = 'block';
    } else {
        document.getElementById('planet-info').style.display = 'none';
    }
}

window.addEventListener('resize', onWindowResize, false);
window.addEventListener('mousemove', onMouseMove, false);

document.getElementById('pause-resume').addEventListener('click', function() {
    isPaused = !isPaused;
    this.textContent = isPaused ? 'Resume' : 'Pause';
});

document.getElementById('reset-view').addEventListener('click', function() {
    new TWEEN.Tween(camera.position)
        .to({ x: 0, y: 0, z: 100 }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
});

document.getElementById('orbit-speed').addEventListener('input', function() {
    orbitSpeed = this.value;
});

document.getElementById('show-labels').addEventListener('change', function() {
    planets.forEach(planet => {
        if (planet.label) {
            planet.label.visible = this.checked;
        }
    });
});

document.getElementById('show-orbits').addEventListener('change', function() {
    orbitLines.forEach(orbit => {
        orbit.visible = this.checked;
    });
});

document.getElementById('toggle-night-mode').addEventListener('click', function() {
    document.body.classList.toggle('night-mode');
});

document.getElementById('focus-planet').addEventListener('change', function() {
    const planetName = this.value;
    if (planetName) {
        const planet = planets.find(p => p.name === planetName);
        new TWEEN.Tween(camera.position)
            .to({ x: planet.mesh.position.x, y: planet.mesh.position.y + 10, z: planet.mesh.position.z + 20 }, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();
    }
});

init();