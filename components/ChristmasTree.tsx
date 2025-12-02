import React, { useRef, useEffect, useState } from 'react';

// --- Types & Interfaces ---

interface Point3D {
  x: number;
  y: number;
  z: number;
  color: string;
  size: number;
  type: 'tree' | 'ornament' | 'star' | 'snow' | 'tip';
  alpha: number;
  originalY?: number; // Store original Y for animation
  speed?: number;
  drift?: number;
  offset?: number;
  flashRate?: number;
  flashOffset?: number;
  rotationSpeed?: number; // Added for spinning snowflakes
  sparkleOffset?: number; // For twinkling effect
}

interface FireworkParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

interface CodeParticle {
    x: number;
    y: number;
    char: string;
    speed: number;
    alpha: number;
    color: string;
    fontSize: number;
}

// --- Configuration ---
const CONFIG = {
  treeHeight: 600, // Doubled size
  treeRadius: 220, // Doubled radius
  particleCount: 5000, // Increased density for larger tree
  ornamentCount: 250,
  snowCount: 1500, // More snow
  perspective: 800,
  rotationSpeed: 0.015,
  riseDuration: 5000, // ms for tree to surface
};

interface Props {
  onAnimationComplete?: () => void;
}

const ChristmasTree: React.FC<Props> = ({ onAnimationComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main Animation Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;
    const startTime = Date.now();
    let fireworksTriggered = false;

    // --- Initialize Particles ---
    const particles: Point3D[] = [];
    const snowParticles: Point3D[] = [];
    let fireworks: FireworkParticle[] = [];
    const codeParticles: CodeParticle[] = [];

    // 0. Create Background Code Rain
    const codeChars = '01{}[]<>/\\*&^%$#@!;:python_tree_render()';
    const codeColors = ['#225522', '#336633', '#114411', '#0f380f', '#00ff0033'];
    
    // Initialize code columns
    for (let i = 0; i < 150; i++) {
        codeParticles.push({
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
            char: codeChars.charAt(Math.floor(Math.random() * codeChars.length)),
            speed: 1 + Math.random() * 2,
            alpha: 0.1 + Math.random() * 0.2, // Very subtle
            color: codeColors[Math.floor(Math.random() * codeColors.length)],
            fontSize: 10 + Math.random() * 14
        });
    }

    // Helper for Gold Colors
    const getGoldColor = () => `hsl(${40 + Math.random() * 15}, ${80 + Math.random() * 20}%, ${50 + Math.random() * 30}%)`;

    // 1. Create Tree Spiral (Gold)
    for (let i = 0; i < CONFIG.particleCount; i++) {
      const t = i / CONFIG.particleCount; 
      const h = CONFIG.treeHeight * t - (CONFIG.treeHeight / 2);
      const r = CONFIG.treeRadius * (1 - t);
      const spiralAngle = t * 40 * Math.PI; 
      
      const jitter = 3;
      const x = r * Math.cos(spiralAngle) + (Math.random() - 0.5) * jitter;
      const z = r * Math.sin(spiralAngle) + (Math.random() - 0.5) * jitter;
      
      // Adjusted vertical offset for larger tree
      const y = h + (CONFIG.treeHeight / 2) - 200; 
      
      particles.push({
        x,
        y: -y, // Render Y
        originalY: -y, // Target Y
        z,
        color: getGoldColor(),
        size: 1.2 + Math.random() * 1.5,
        type: 'tree',
        alpha: 0.8 + Math.random() * 0.2,
        sparkleOffset: Math.random() * 100
      });
    }

    // 1.5 Create Extra Density at Tip
    const tipCount = 200;
    for (let i = 0; i < tipCount; i++) {
        // Concentrate at top
        const h = (CONFIG.treeHeight / 2) - (Math.random() * 60); 
        // Very tight radius
        const r = Math.random() * 20 * (1 - (i/tipCount)); 
        const spiralAngle = Math.random() * Math.PI * 2 * 10;
        
        const x = r * Math.cos(spiralAngle);
        const z = r * Math.sin(spiralAngle);
        const y = h + (CONFIG.treeHeight / 2) - 200;

        particles.push({
            x,
            y: -y,
            originalY: -y,
            z,
            color: '#FFF8DC', // Cornsilk/bright gold
            size: 1.0 + Math.random(),
            type: 'tip',
            alpha: 0.9,
            sparkleOffset: Math.random() * 100
        });
    }

    // 2. Create Ornaments
    for (let i = 0; i < CONFIG.ornamentCount; i++) {
        const t = Math.random();
        const h = CONFIG.treeHeight * t - (CONFIG.treeHeight / 2);
        const r = CONFIG.treeRadius * (1 - t);
        const spiralAngle = Math.random() * Math.PI * 2;

        const x = r * Math.cos(spiralAngle);
        const z = r * Math.sin(spiralAngle);
        const y = h + (CONFIG.treeHeight / 2) - 200;

        // Keep ornaments colorful to contrast with gold tree, or make them Red/Silver
        const colors = ['#FF0000', '#FFFFFF', '#00FFFF', '#FF1493', '#FF4500'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        particles.push({
            x,
            y: -y,
            originalY: -y,
            z,
            color: color,
            size: 3 + Math.random() * 2,
            type: 'ornament',
            alpha: 1,
            flashRate: 0.05 + Math.random() * 0.05,
            flashOffset: Math.random() * Math.PI * 2,
        });
    }

    // 3. Create Star Point
    // Calculate star position based on tree geometry
    const starY = -(CONFIG.treeHeight - 200 + 10); // slightly above tip
    particles.push({
        x: 0,
        y: starY,
        originalY: starY,
        z: 0,
        color: '#FFFFFF',
        size: 0, 
        type: 'star',
        alpha: 1,
    });
    

    // 4. Create Snow (Detailed Silver Snowflakes)
    for(let i=0; i < CONFIG.snowCount; i++) {
        const silverShades = ['#C0C0C0', '#E8E8E8', '#D3D3D3', '#708090'];
        snowParticles.push({
            x: (Math.random() - 0.5) * dimensions.width * 2.5,
            y: (Math.random() - 1.0) * dimensions.height * 1.5,
            z: (Math.random() - 0.5) * 1000,
            color: silverShades[Math.floor(Math.random() * silverShades.length)],
            size: 1.5 + Math.random() * 3,
            type: 'snow',
            alpha: 0.4 + Math.random() * 0.6,
            speed: 0.5 + Math.random() * 2,
            drift: 0.2 + Math.random() * 0.5,
            offset: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
        });
    }

    // --- Helper: Create Explosion ---
    const createExplosion = (ex: number, ey: number, ez: number, count: number, colorBase: string) => {
        for(let i=0; i<count; i++) {
            const speed = 3 + Math.random() * 5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            fireworks.push({
                x: ex, y: ey, z: ez,
                vx: speed * Math.sin(phi) * Math.cos(theta),
                vy: speed * Math.cos(phi),
                vz: speed * Math.sin(phi) * Math.sin(theta),
                color: colorBase,
                alpha: 1,
                life: 1.0,
                maxLife: 1.0,
                size: 2 + Math.random() * 2
            });
        }
    };

    // --- Draw Star Rays ---
    const drawStarRays = (ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number, scale: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        
        // Glow center - enhanced
        const gradient = ctx.createRadialGradient(0, 0, 1, 0, 0, 60 * scale);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.1, "rgba(255, 255, 200, 0.9)");
        gradient.addColorStop(0.4, "rgba(255, 215, 0, 0.4)");
        gradient.addColorStop(1, "rgba(255, 215, 0, 0)");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 70 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Rays
        const rays = 16; // More rays
        ctx.rotate(time * 0.0005); 
        for (let i = 0; i < rays; i++) {
            ctx.rotate((Math.PI * 2) / rays);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            
            // Dynamic length and flicker
            const flicker = Math.sin(time * 0.01 + i * 10) * 0.2 + 1;
            const len = (90 + Math.sin(time * 0.005 + i) * 30) * scale * flicker;
            const width = (1.5 + Math.cos(time * 0.005 + i)) * scale;
            
            // Draw Ray
            const rayGrad = ctx.createLinearGradient(0, 0, len, 0);
            rayGrad.addColorStop(0, "rgba(255, 255, 240, 0.9)");
            rayGrad.addColorStop(0.4, "rgba(255, 215, 0, 0.5)");
            rayGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
            
            ctx.fillStyle = rayGrad;
            ctx.fillRect(0, -width/2, len, width);
        }
        
        ctx.restore();
    };


    const render = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      // Calculate progress (0 to 1)
      let progress = Math.min(elapsed / CONFIG.riseDuration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      // Trigger Fireworks on Completion
      if (progress >= 1 && !fireworksTriggered) {
          fireworksTriggered = true;
          // Adjusted y-coordinates for larger tree (Top is around -400 to -450)
          createExplosion(0, -500, 0, 120, '#FFD700'); 
          setTimeout(() => createExplosion(-150, -400, 50, 100, '#FFA500'), 250);
          setTimeout(() => createExplosion(150, -400, -50, 100, '#FFC0CB'), 500); 
          if (onAnimationComplete) onAnimationComplete();
      }

      ctx.fillStyle = '#020205'; 
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // --- Draw Background Code ---
      codeParticles.forEach(p => {
          p.y += p.speed;
          if (p.y > dimensions.height) {
              p.y = -20;
              p.x = Math.random() * dimensions.width;
              p.char = codeChars.charAt(Math.floor(Math.random() * codeChars.length));
          }
          ctx.fillStyle = p.color;
          ctx.font = `${p.fontSize}px monospace`;
          ctx.globalAlpha = p.alpha;
          ctx.fillText(p.char, p.x, p.y);
      });
      ctx.globalAlpha = 1;


      const cx = dimensions.width / 2;
      const cy = dimensions.height / 2 + 50; // Shifted up slightly to accommodate larger tree

      // Update Rotation - Spin faster during opening animation
      angle += CONFIG.rotationSpeed + (1 - easedProgress) * 0.05;
      
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // --- Draw Tree & Ornaments (Sorted by Z) ---
      const projectedParticles = particles.map(p => {
        // Rise from further down (1500px)
        const currentY = (p.originalY || 0) + (1 - easedProgress) * 1500;
        
        const rx = p.x * cos - p.z * sin;
        const rz = p.x * sin + p.z * cos;

        const scale = CONFIG.perspective / (CONFIG.perspective + rz + 400); 
        
        return {
          ...p,
          currentY,
          px: rx * scale + cx,
          py: currentY * scale + cy,
          scale,
          rz,
          currentAlpha: p.alpha * easedProgress
        };
      });

      projectedParticles.sort((a, b) => b.rz - a.rz);

      projectedParticles.forEach(p => {
        if (p.scale < 0) return; 

        if (p.type === 'star') {
            if (easedProgress > 0.8) {
                drawStarRays(ctx, p.px, p.py, now, p.scale);
            }
            return; 
        }

        let alpha = p.currentAlpha;
        
        ctx.beginPath();
        if (p.type === 'tree' || p.type === 'tip') {
            
            // Sparkling/Particle Effect
            // Calculate a twinkle value based on time and random offset
            const twinkle = Math.sin(now * 0.008 + (p.sparkleOffset || 0));
            
            if (twinkle > 0.92) {
                // Flash bright white/gold
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowBlur = 8 * p.scale;
                ctx.shadowColor = '#FFFFFF';
            } else if (twinkle > 0.7) {
                 ctx.fillStyle = '#FFFACD'; // LemonChiffon (bright gold)
                 ctx.shadowBlur = 2;
                 ctx.shadowColor = p.color;
            } else {
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 0;
            }

            if (p.scale > 1.5) {
                // Subtle glow for closer particles
                ctx.shadowBlur = 4;
                ctx.shadowColor = p.color;
            }
        } else if (p.type === 'ornament') {
            ctx.fillStyle = p.color;
            const flash = Math.abs(Math.sin(now * (p.flashRate || 0.01) + (p.flashOffset || 0)));
            if (easedProgress > 0.5) {
                alpha = flash > 0.5 ? 1 : 0.3; 
                if (alpha === 1) {
                    ctx.shadowBlur = 10 * flash;
                    ctx.shadowColor = p.color;
                }
            }
        } 

        ctx.globalAlpha = alpha;
        ctx.arc(p.px, p.py, p.size * p.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      // --- Draw Detailed Snow ---
      snowParticles.forEach(p => {
          p.y += (p.speed || 1);
          p.x += Math.sin(now * 0.001 + (p.offset || 0)) * (p.drift || 0.5);

          const limitY = dimensions.height / 1.5; // Only reset when really low
          
          // Reset when out of bounds
          if (p.y > dimensions.height || p.y > limitY + 500) { 
              p.y = -dimensions.height; 
              p.x = (Math.random() - 0.5) * dimensions.width * 2.5; 
          }

          const scale = CONFIG.perspective / (CONFIG.perspective + p.z);
          const px = p.x * scale + cx;
          const py = p.y * scale + cy;

          if (scale > 0) {
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate((p.offset || 0) + elapsed * (p.rotationSpeed || 0)); 
            
            ctx.globalAlpha = p.alpha;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1 * scale;
            ctx.lineCap = 'round';

            const size = p.size * scale;
            for(let i=0; i<3; i++) {
                ctx.beginPath();
                ctx.moveTo(-size, 0);
                ctx.lineTo(size, 0);
                ctx.stroke();
                ctx.rotate(Math.PI / 3);
            }
            
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
      });
      ctx.globalAlpha = 1;

      // --- Draw Fireworks ---
      fireworks.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;
          p.vy += 0.05; 
          p.vx *= 0.96; 
          p.vz *= 0.96;
          p.life -= 0.015;
          p.alpha = Math.max(0, p.life);
      });
      fireworks = fireworks.filter(p => p.life > 0);

      fireworks.forEach(p => {
          const rx = p.x * cos - p.z * sin;
          const rz = p.x * sin + p.z * cos;
          const scale = CONFIG.perspective / (CONFIG.perspective + rz + 400);

          if(scale > 0) {
              const px = rx * scale + cx;
              const py = p.y * scale + cy;

              ctx.beginPath();
              ctx.fillStyle = p.color;
              ctx.globalAlpha = p.alpha;
              ctx.arc(px, py, p.size * scale, 0, Math.PI * 2);
              ctx.fill();
              
              if (Math.random() > 0.7) {
                   ctx.shadowBlur = 15;
                   ctx.shadowColor = p.color;
                   ctx.fill();
                   ctx.shadowBlur = 0;
              }
          }
      });
      ctx.globalAlpha = 1;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [dimensions, onAnimationComplete]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="block w-full h-full"
    />
  );
};

export default ChristmasTree;