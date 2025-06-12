/**
 * 初始化邮箱
 */
function initEmail() {
    const submitBtn = document.getElementById('email-submit-btn');
    const subjectInput = document.getElementById('email-subject');
    const senderEmailInput = document.getElementById('email-sender');
    const messageTextarea = document.getElementById('email-message');

    if (submitBtn) {
        submitBtn.addEventListener('click', function () {
            const subject = subjectInput.value;
            const senderEmail = senderEmailInput.value;
            const message = messageTextarea.value;

            const myEmail = 'minorcell6789@gmail.com';

            const body = `你好 mCell,\n\n${message}\n\n--\n发件人: ${senderEmail}`;

            const mailtoLink = `mailto:${myEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            window.location.href = mailtoLink;
        });
    }
}

/**
 * 初始化光标
 */
function initCursor() {
    const cursor = document.querySelector('.cursor');
    const cursorFollower = document.querySelector('.cursor-follower');

    document.addEventListener('mousemove', function (e) {
        gsap.to(cursor, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.05
        });

        gsap.to(cursorFollower, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.15,
            ease: "power2.inOut",
            rotation: "+=180"
        });
    });

    const hoverElements = document.querySelectorAll('.hover-element');

    hoverElements.forEach(element => {
        element.addEventListener('mouseenter', function () {
            cursor.classList.add('active');
            cursorFollower.classList.add('active');
        });

        element.addEventListener('mouseleave', function () {
            cursor.classList.remove('active');
            cursorFollower.classList.remove('active');
        });
    });
}

/**
 * 初始化水平滚动
 */
function initHorizontalScroll() {
    let currentSection = 0;
    const sections = document.querySelectorAll('.section');
    const navDots = document.querySelectorAll('.nav-dot');
    const container = document.querySelector('.horizontal-container');

    // 初始化GSAP的ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // 创建水平滚动效果
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".horizontal-container",
            pin: true,
            start: "top top",
            end: "+=3000",
            scrub: 1,
            onUpdate: self => {
                // 更新当前部分
                const newSection = Math.floor(self.progress * sections.length);
                if (newSection !== currentSection && newSection < sections.length) {
                    updateActiveSection(newSection);
                }
            },
        }
    });

    // 动画化容器水平滚动
    tl.to(container, {
        x: () => -(container.scrollWidth - window.innerWidth),
        ease: "none"
    });

    // 更新活动部分
    function updateActiveSection(index) {
        currentSection = index;

        // 更新导航点
        navDots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // 触发特定部分的动画
        animateSection(index);
    }

    // 点击事件导航点
    navDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            const scrollProgress = index / (sections.length - 1);
            const scrollPosition = scrollProgress * (ScrollTrigger.maxScroll(window) || 3000);

            gsap.to(window, {
                scrollTo: scrollPosition,
                duration: 1,
                ease: "power2.inOut"
            });
        });
    });

    // 一些视差动画
    function animateSection(index) {
        // 重置所有部分的公共属性，确保动画正确触发
        gsap.set(['.about-text', '.about-skills', '.about-image', '.contact-text', '.contact-form', '.contact-info'], {
            opacity: 0,
            y: 50,
            rotationX: 100,
            transformOrigin: "top center"
        });
        gsap.set('.project-card', { opacity: 0, y: 100, rotationX: 0 });
        gsap.set(['.hero-title', '.hero-subtitle', '#hero-cta'], { opacity: 0 });

        switch (index) {
            case 0: // 主页部分
                document.title = 'mCell 个人主页 | 欢迎页';
                const heroTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
                const heroTitleParts = document.querySelectorAll('.hero-title-text');
                const heroSubtitle = document.querySelector('.hero-subtitle');

                heroTitleParts.forEach(part => {
                    const text = part.textContent;
                    part.textContent = '';
                    for (let i = 0; i < text.length; i++) {
                        const charSpan = document.createElement('span');
                        charSpan.textContent = text[i];
                        charSpan.style.display = 'inline-block';
                        charSpan.style.opacity = '0';
                        charSpan.style.transform = 'translateY(20px)';
                        part.appendChild(charSpan);
                    }
                });
                const subtitleText = heroSubtitle.textContent;
                heroSubtitle.textContent = '';
                for (let i = 0; i < subtitleText.length; i++) {
                    const charSpan = document.createElement('span');
                    charSpan.textContent = subtitleText[i];
                    charSpan.style.display = 'inline-block';
                    charSpan.style.opacity = '0';
                    charSpan.style.transform = 'translateY(20px)';
                    heroSubtitle.appendChild(charSpan);
                }

                heroTl.to('.hero-title', { opacity: 1 })
                    .to('.hero-title-text span', {
                        opacity: 1,
                        y: 0,
                        stagger: 0.05,
                        duration: 0.5
                    })
                    .to('.hero-subtitle', { opacity: 1 }, "-=0.5")
                    .to('.hero-subtitle span', {
                        opacity: 1,
                        y: 0,
                        stagger: 0.03,
                        duration: 0.4
                    }, "-=0.5")
                    .to('#hero-cta', { opacity: 1, y: 0, duration: 0.8 }, "-=0.5");
                break;
            case 1: // 关于我部分
                document.title = 'mCell 个人主页 | 关于我';
                gsap.to('.about-text', { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power2.out', stagger: 0.2 });
                gsap.to('.about-skills', { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power2.out', delay: 0.4 });
                gsap.to('.about-image', { opacity: 1, y: 0, rotationX: 0, duration: 1, ease: 'power2.out', delay: 0.2 });
                break;
            case 2: // 个人作品部分
                document.title = 'mCell 个人主页 | 个人作品';
                gsap.to('.project-card', { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power2.out', stagger: 0.2 });
                break;
            case 3: // 联系方式部分
                document.title = 'mCell 个人主页 | 联系方式';
                gsap.to('.contact-text', { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power2.out' });
                gsap.to('.contact-form', { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power2.out', delay: 0.2 });
                gsap.to('.contact-info', { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power2.out', delay: 0.4 });
                break;
        }
    }

    // 初始化第一个部分的动画
    gsap.set(['.hero-title', '.hero-subtitle', '#hero-cta'], { opacity: 0 });
    animateSection(0);
}

/**
 * 初始化备案信息
 */
function initIcpInfo() {
    const icpInfo = document.querySelector('.icp-info');
    icpInfo.innerHTML = `© ${new Date().getFullYear()} Created by mcell 豫ICP备2025129196号-1`;
}

/**
 * 初始化爱心
 */
function initHeartMagnetic() {
    const container = document.getElementById("heartSvg");
    const balls = [];
    const spacing = 12;
    const radius = 5;
    const mouseRadius = 150;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const left = rect.left;
    const top = rect.top;

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 280;
    const color = '#99aebb'

    function isInsideHeart(x, y) {
        const nx = (x - centerX) / scale;
        const ny = -(y - centerY) / scale;
        return Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny < 0;
    }

    function createHeart() {
        const cols = Math.floor(width / spacing);
        const rows = Math.floor(height / spacing);

        for (let i = 0; i <= cols; i++) {
            for (let j = 0; j <= rows; j++) {
                const x = i * spacing;
                const y = j * spacing;

                if (!isInsideHeart(x, y)) continue;

                const ball = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                ball.setAttribute("fill", color);
                ball.setAttribute("cx", x);
                ball.setAttribute("cy", y);
                ball.setAttribute("r", radius);

                const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                point.setAttribute("fill", color);
                point.setAttribute("cx", x);
                point.setAttribute("cy", y);
                point.setAttribute("r", radius / 3);

                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", x);
                line.setAttribute("y1", y);
                line.setAttribute("x2", x);
                line.setAttribute("y2", y);
                line.setAttribute("stroke", color);
                line.setAttribute("stroke-width", "1.5");

                container.appendChild(line);
                container.appendChild(point);
                container.appendChild(ball);

                balls.push({
                    element: ball,
                    line: line,
                    ori_x: x,
                    ori_y: y,
                    animater: null
                });
            }
        }
    }

    function moveBalls(mouseX, mouseY) {
        const localX = mouseX - left;
        const localY = mouseY - top;

        balls.forEach(ball => {
            const dx = ball.ori_x - localX;
            const dy = ball.ori_y - localY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= mouseRadius) {
                const moveX = localX + (dx / distance) * mouseRadius;
                const moveY = localY + (dy / distance) * mouseRadius;

                if (ball.animater) ball.animater.kill();

                ball.animater = gsap.timeline()
                    .to(ball.element, {
                        attr: { cx: moveX, cy: moveY },
                        duration: 0.5,
                        ease: "power3.out"
                    })
                    .to(ball.line, {
                        attr: { x2: moveX, y2: moveY },
                        duration: 0.5,
                        ease: "power3.out"
                    }, "<")
                    .to(ball.element, {
                        attr: { cx: ball.ori_x, cy: ball.ori_y },
                        duration: 1,
                        ease: "power3.out"
                    }, "<0.1")
                    .to(ball.line, {
                        attr: { x2: ball.ori_x, y2: ball.ori_y },
                        duration: 1,
                        ease: "power3.out"
                    }, "<");
            }
        });
    }

    createHeart();
    document.addEventListener("mousemove", e => moveBalls(e.clientX, e.clientY));
}

/**
 * 初始化
 */
document.addEventListener('DOMContentLoaded', function () {
    initEmail();
    initCursor();
    initHorizontalScroll();
    initIcpInfo();
    initHeartMagnetic();
});