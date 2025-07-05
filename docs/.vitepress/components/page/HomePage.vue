<template>
  <div class="poketto-home">
    <div class="tech-background" :style="techBgStyle">
      <div 
        v-for="(tech, index) in techStack" 
        :key="index"
        class="floating-tech"
        :style="getTechStyle(tech)"
        :title="tech.name"
      >
        <Icon v-if="tech.icon" :icon="tech.icon" />
        <span v-else class="text-icon">{{ tech.name }}</span>
      </div>
    </div>

    <div class="main-container" :style="mainStyle">
      <div class="main-content">
        <div class="content-header">
          <h1 class="main-title">mCell的个人主页</h1>
          <p class="main-subtitle">
            遇事不决，可问春风；春风不遇，可随本心；
          </p>
        </div>

        <div class="quick-actions">
          <a href="/markdown-examples" class="action-btn primary">浏览动态</a>
          <a href="/api-examples" class="action-btn secondary">查看小册</a>
        </div>
      </div>
    </div>

    <div class="footer-info">
      <p>© {{ getYear() }} Created by mcell 豫ICP备2025129196号-1</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const years = ref('2025')

const techStack = ref([
  { name: 'Git', icon: 'logos:git-icon' },
  { name: 'HTML', icon: 'logos:html-5' },
  { name: 'CSS', icon: 'logos:css-3' },
  { name: 'JavaScript', icon: 'logos:javascript' },
  { name: 'TypeScript', icon: 'logos:typescript-icon' },
  { name: 'Vue', icon: 'logos:vue' },
  { name: 'React', icon: 'logos:react' },
  { name: 'UniApp', icon: null },
  { name: 'React Native', icon: 'logos:react' },
  { name: 'Node.js', icon: 'logos:nodejs-icon' },
  { name: 'Next.js', icon: 'logos:nextjs-icon' },
  { name: 'Nest.js', icon: 'logos:nestjs' },
  { name: 'Nuxt.js', icon: 'logos:nuxt-icon' },
  { name: 'Gin', icon: null },
  { name: 'Tailwind', icon: 'logos:tailwindcss-icon' },
  { name: 'Sass', icon: 'logos:sass' },
  { name: 'Less', icon: 'logos:less' },
  { name: 'Three.js', icon: 'logos:threejs' },
  { name: 'Electron', icon: 'logos:electron' },
  { name: 'Tauri', icon: 'logos:tauri' },
  { name: 'Docker', icon: 'logos:docker-icon' },
  { name: 'Linux', icon: 'logos:linux-tux' },
  { name: 'Go', icon: 'logos:go' },
  { name: 'MySQL', icon: 'logos:mysql-icon' },
  { name: 'PostgreSQL', icon: 'logos:postgresql' },
  { name: 'MongoDB', icon: 'logos:mongodb-icon' },
  { name: 'Redis', icon: 'logos:redis' },
  { name: 'Fyne', icon: null }
])

const techPositions = ref(new Map())

const techCount = computed(() => techStack.value.length)

const tiltX = ref(0)
const tiltY = ref(0)

const techBgStyle = computed(() => ({
  transform: `rotateX(${tiltY.value}deg) rotateY(${tiltX.value}deg)`
}))

const mainStyle = computed(() => ({
  transform: `rotateX(${tiltY.value * -0.8}deg) rotateY(${tiltX.value * -0.8}deg)`
}))

function handleMouseMove(e) {
  const w = window.innerWidth
  const h = window.innerHeight
  const dx = (e.clientX - w / 2) / (w / 2)
  const dy = (e.clientY - h / 2) / (h / 2)
  const maxDeg = 10
  tiltX.value = dx * maxDeg
  tiltY.value = -dy * maxDeg
}

function generateGridPositions() {
  const positions = new Map()
  const gridCols = 20 
  const gridRows = 12  
  
  const availablePositions = []
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {      
      availablePositions.push({ row, col })
    }
  }
  
  for (let i = availablePositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]]
  }
  
  techStack.value.forEach((tech, index) => {
    if (index < availablePositions.length) {
      const pos = availablePositions[index]
      const x = (pos.col / (gridCols - 1)) * 100
      const y = (pos.row / (gridRows - 1)) * 100
      
      const opacity = 0.3 + Math.random() * 0.5
      const scale = 0.6 + Math.random() * 0.4
      const rotationSpeed = 10 + Math.random() * 10
      const floatSpeed = 15 + Math.random() * 40
      
      const animations = ['gentleFloat', 'slowSpin', 'wavyFloat']
      const animationType = animations[Math.floor(Math.random() * animations.length)]
      
      positions.set(tech.name, {
        left: `${Math.max(5, Math.min(95, x))}%`,
        top: `${Math.max(5, Math.min(95, y))}%`,
        opacity: opacity,
        scale: scale,
        animationDelay: `${Math.random() * 2}s`,
        animationDuration: `${rotationSpeed}s`,
        floatDuration: `${floatSpeed}s`,
        rotation: Math.random() * 360,
        animationType: animationType,
        fontSize: `${1.2 + Math.random() * 1.8}rem`,
        gridPos: `(${pos.row}, ${pos.col})`
      })
    }
  })
  
  techPositions.value = positions
}

function getTechStyle(tech) {
  const style = techPositions.value.get(tech.name)
  if (!style) return {}
  
  return {
    left: style.left,
    top: style.top,
    opacity: style.opacity,
    fontSize: style.fontSize,
    '--base-scale': style.scale,
    '--base-rotation': style.rotation + 'deg',
    animation: `${style.animationType} ${style.animationDuration} linear infinite`,
    animationDelay: style.animationDelay
  }
}

function getYear() {
  const nowYear = new Date().getFullYear()
  if (nowYear == 2025) {
    return '2025'
  }
  return `${years.value} - ${nowYear}`
}

onMounted(() => {
  generateGridPositions()
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('resize', generateGridPositions)
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<style>
.poketto-home {
  min-height: 100vh;
  background: #0d1117;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
  overflow: hidden;
  perspective: 800px;
  perspective-origin: center;
}

.tech-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  transform-style: preserve-3d;
  transition: transform 0.1s ease-out;
}

.floating-tech {
  position: absolute;
  color: #99aebb;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-fill-mode: both;
  transition: all 0.3s ease;
  will-change: transform;
}

@keyframes gentleFloat {
  0% {
    transform: translateY(0px) translateX(0px) rotate(calc(var(--base-rotation, 0deg) + 0deg)) scale(var(--base-scale, 1));
  }
  25% {
    transform: translateY(-15px) translateX(10px) rotate(calc(var(--base-rotation, 0deg) + 90deg)) scale(var(--base-scale, 1));
  }
  50% {
    transform: translateY(-10px) translateX(-5px) rotate(calc(var(--base-rotation, 0deg) + 180deg)) scale(var(--base-scale, 1));
  }
  75% {
    transform: translateY(-20px) translateX(5px) rotate(calc(var(--base-rotation, 0deg) + 270deg)) scale(var(--base-scale, 1));
  }
  100% {
    transform: translateY(0px) translateX(0px) rotate(calc(var(--base-rotation, 0deg) + 360deg)) scale(var(--base-scale, 1));
  }
}

@keyframes slowSpin {
  0% {
    transform: rotate(calc(var(--base-rotation, 0deg) + 0deg)) scale(var(--base-scale, 1));
  }
  50% {
    transform: rotate(calc(var(--base-rotation, 0deg) + 180deg)) scale(calc(var(--base-scale, 1) * 1.1));
  }
  100% {
    transform: rotate(calc(var(--base-rotation, 0deg) + 360deg)) scale(var(--base-scale, 1));
  }
}

@keyframes wavyFloat {
  0% {
    transform: translateY(0px) translateX(0px) rotate(calc(var(--base-rotation, 0deg) + 0deg)) scale(var(--base-scale, 1));
  }
  16% {
    transform: translateY(-25px) translateX(15px) rotate(calc(var(--base-rotation, 0deg) + 60deg)) scale(var(--base-scale, 1));
  }
  33% {
    transform: translateY(-10px) translateX(25px) rotate(calc(var(--base-rotation, 0deg) + 120deg)) scale(var(--base-scale, 1));
  }
  50% {
    transform: translateY(-30px) translateX(10px) rotate(calc(var(--base-rotation, 0deg) + 180deg)) scale(var(--base-scale, 1));
  }
  66% {
    transform: translateY(-5px) translateX(-15px) rotate(calc(var(--base-rotation, 0deg) + 240deg)) scale(var(--base-scale, 1));
  }
  83% {
    transform: translateY(-20px) translateX(-25px) rotate(calc(var(--base-rotation, 0deg) + 300deg)) scale(var(--base-scale, 1));
  }
  100% {
    transform: translateY(0px) translateX(0px) rotate(calc(var(--base-rotation, 0deg) + 360deg)) scale(var(--base-scale, 1));
  }
}

.floating-tech:hover {
  animation-play-state: paused;
  opacity: 0.8 !important;
  transform: scale(1.3) !important;
  transition: all 0.3s ease;
  z-index: 10;
}

.floating-tech .text-icon {
  font-size: 0.5em;
  font-weight: 600;
  color: inherit;
  background: rgba(153, 174, 187, 0.2);
  padding: 0.2em 0.4em;
  border: 1px solid rgba(153, 174, 187, 0.3);
  white-space: nowrap;
  border-radius: 0.2em;
  min-width: 2em;
  text-align: center;
  line-height: 1.2;
}

.main-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 80px 2rem 2rem;
  position: relative;
  z-index: 10;
  transform-style: preserve-3d;
  transition: transform 0.1s ease-out;
}

.main-content {
  max-width: 1000px;
  text-align: center;
}

.content-header {
  margin-bottom: 3rem;
}

.main-title {
  font-size: 6rem;
  font-weight: 600;
  color: #f0f6fc;
  margin-bottom: 4rem;
  line-height: 1.2;
  background: linear-gradient(120deg, #99aebb 0%, #c0d5e0 50%, #99aebb 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: gradientShift 6s linear infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% center; }
  100% { background-position: -200% center; }
}

.main-subtitle {
  font-size: 2rem;
  line-height: 1.6;
  margin-bottom: 4rem;
  background: linear-gradient(90deg, #ff7e5f, #feb47b, #86eedc, #8f7aff, #ff7e5f);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: subtitleGradient 8s ease infinite;
  position: relative;
  overflow: hidden;
}

@keyframes subtitleGradient {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.quick-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.action-btn {
  padding: 0.6em 1.2em;
  text-decoration: none;
  font-weight: 500;
  border: 1px solid transparent;
  font-size: 1rem;
}

.action-btn.primary {
  background: #99aebb;
  color: #0d1117;
}

.action-btn.secondary {
  background: transparent;
  color: #99aebb;
  border-color: #99aebb;
}

.footer-info {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 100;
}

.footer-info p {
  font-size: 0.8rem;
  color: #6e7681;
  margin: 0;
}

@media (max-width: 1024px) {
  .main-title {
    font-size: 3rem;
  }
}

@media (max-width: 768px) {
  .main-container {
    padding: 100px 1rem 2rem;
  }
  
  .main-title {
    font-size: 2.5rem;
  }
  
  .main-subtitle {
    font-size: 1rem;
  }
  
  .quick-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .action-btn {
    width: 100%;
    max-width: 200px;
  }
  
  .floating-tech {
    transform: scale(0.7) !important;
  }
  
  .floating-tech .text-icon {
    font-size: 0.4em;
    padding: 0.15em 0.3em;
    min-width: 1.5em;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 2rem;
  }
  
  .floating-tech {
    transform: scale(0.5) !important;
  }
  
  .floating-tech .text-icon {
    font-size: 0.3em;
    padding: 0.1em 0.2em;
    min-width: 1.2em;
  }
  
  @keyframes gentleFloat {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(180deg); }
  }
  
  @keyframes slowSpin {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(180deg); }
  }
  
  @keyframes wavyFloat {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    25% { transform: translateY(-15px) rotate(90deg); }
    50% { transform: translateY(-5px) rotate(180deg); }
    75% { transform: translateY(-10px) rotate(270deg); }
  }
}
</style> 