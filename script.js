const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');

let particles = [];
let rockets = [];
let hue = 0; // Untuk mengubah warna kembang api seiring waktu

// --- MODIFIKASI: Parameter Global yang Lebih Mudah Diatur ---
const FIREWORKS_CONFIG = {
    PARTICLE_GRAVITY: 0.3,           // <-- MODIFIKASI: Turunkan untuk efek jatuh lebih lambat
    PARTICLE_FRICTION: 0.96,         // <-- MODIFIKASI: Naikkan untuk meredam kecepatan lebih smooth
    PARTICLE_DECAY_RATE: 0.01,       // <-- MODIFIKASI: Turunkan untuk memudar lebih lambat
    PARTICLE_COORDINATE_COUNT: 6,    // <-- MODIFIKASI: Naikkan untuk jejak lebih panjang

    ROCKET_MIN_SPEED: window.innerHeight / 80,
    ROCKET_MAX_SPEED: window.innerHeight / 40,

    EXPLOSION_MIN_PARTICLES: 100,
    EXPLOSION_MAX_PARTICLES: 200,

    ROCKET_SPAWN_PROBABILITY: 0.04,
    MAX_ACTIVE_ROCKETS: 6,

    TRAIL_FADE_ALPHA: 0.6,

    HUE_CHANGE_RATE: 0.7,
    HUE_MIN: 200,
    HUE_MAX: 280
};
// --- AKHIR MODIFIKASI PARAMETER GLOBAL ---


// Mengatur ukuran canvas agar sesuai dengan jendela browser
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Panggil saat halaman pertama kali dimuat

// Event Listener untuk klik mouse
canvas.addEventListener('mousedown', (e) => {
    // Luncurkan roket dari posisi X klik, dari bawah layar
    rockets.push(new Rocket(e.clientX, canvas.height, true)); // 'true' menandakan ini roket dari klik
});


// Fungsi untuk mendapatkan angka acak dalam rentang tertentu
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// Objek Particle (untuk percikan kembang api)
class Particle {
    constructor(x, y, hue) {
        this.x = x;
        this.y = y;
        this.coordinates = []; // Untuk menyimpan riwayat posisi (untuk trail)
        this.coordinateCount = FIREWORKS_CONFIG.PARTICLE_COORDINATE_COUNT;
        while (this.coordinateCount--) {
            this.coordinates.push([this.x, this.y]);
        }
        this.angle = random(0, Math.PI * 2); // Arah acak
        this.speed = random(0.5, 5); // <-- MODIFIKASI: Kecepatan awal percikan lebih rendah
        this.friction = FIREWORKS_CONFIG.PARTICLE_FRICTION;
        this.gravity = FIREWORKS_CONFIG.PARTICLE_GRAVITY;
        this.hue = hue;
        this.brightness = random(50, 80);
        this.alpha = 1; // Transparansi awal
        this.decay = FIREWORKS_CONFIG.PARTICLE_DECAY_RATE;
        this.blown = false; // Status apakah sudah meledak
    }

    update() {
        this.coordinates.pop(); // Hapus koordinat terlama
        this.coordinates.unshift([this.x, this.y]); // Tambahkan koordinat terbaru

        if (this.blown) { // Jika sudah meledak, terapkan fisika
            this.speed *= this.friction;
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed + this.gravity;
            this.alpha -= this.decay;
        } else {
            this.y -= this.speed; // Logika dasar partikel jika tidak meledak (akan ditimpa oleh Rocket)
        }

        return this.alpha <= this.decay; // Mengembalikan true jika partikel sudah hampir hilang
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
        ctx.stroke();
    }
}

// Objek Rocket (kembang api yang meluncur ke atas)
class Rocket extends Particle {
    constructor(x, y, isFromClick = false) {
        super(x, y, random(FIREWORKS_CONFIG.HUE_MIN, FIREWORKS_CONFIG.HUE_MAX));
        this.speed = random(FIREWORKS_CONFIG.ROCKET_MIN_SPEED, FIREWORKS_CONFIG.ROCKET_MAX_SPEED);
        this.blown = false;
        this.isFromClick = isFromClick;

        this.targetY = random(canvas.height / 4, canvas.height / 2);
    }

    update() {
        if (!this.blown) {
            if (this.y > this.targetY) {
                this.y -= this.speed;
            }

            if (this.y <= this.targetY + this.speed) {
                this.y = this.targetY;
                this.blown = true;
                this.explode();
                return true;
            }
        } else {
            return super.update();
        }
        return false;
    }

    explode() {
        const particleCount = random(FIREWORKS_CONFIG.EXPLOSION_MIN_PARTICLES, FIREWORKS_CONFIG.EXPLOSION_MAX_PARTICLES);
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(this.x, this.y, this.hue));
            particles[particles.length - 1].blown = true;
        }
    }
}

// Fungsi animasi utama
function animate() {
    requestAnimationFrame(animate);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    hue += FIREWORKS_CONFIG.HUE_CHANGE_RATE;
    if (hue > 360) {
        hue = 0;
    }

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0, 0, 0, ${FIREWORKS_CONFIG.TRAIL_FADE_ALPHA})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';

    for (let i = rockets.length - 1; i >= 0; i--) {
        const rocket = rockets[i];
        if (rocket.update()) {
            rockets.splice(i, 1);
        } else {
            rocket.draw();
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        if (particle.update()) {
            particles.splice(i, 1);
        } else {
            particle.draw();
        }
    }

    if (Math.random() < FIREWORKS_CONFIG.ROCKET_SPAWN_PROBABILITY && rockets.length < FIREWORKS_CONFIG.MAX_ACTIVE_ROCKETS) {
        rockets.push(new Rocket(random(0, canvas.width), canvas.height, false));
    }
}

animate();