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
            duration: 0.15
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
    const progressBarFill = document.querySelector('.progress-bar-fill');
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
                // 更新进度条
                progressBarFill.style.width = `${self.progress * 100}%`;

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
        gsap.set(['.hero-title', '.hero-subtitle', '#hero-cta', '.about-text', '.about-skills', '.about-image', '.contact-text', '.contact-form', '.contact-info'], {
            opacity: 0,
            y: 50,
            rotationX: 100,
            transformOrigin: "top center"
        });
        gsap.set('.project-card', { opacity: 0, y: 100, rotationX: 0 });

        switch (index) {
            case 0: // 主页部分
                gsap.to('.hero-title', { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power2.out', delay: 0.2 });
                gsap.to('.hero-subtitle', { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power2.out', delay: 0.4 });
                gsap.to('#hero-cta', { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power2.out', delay: 0.6 });
                break;
            case 1: // 关于我部分
                gsap.to('.about-text', { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power2.out', stagger: 0.2 });
                gsap.to('.about-skills', { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power2.out', delay: 0.4 });
                gsap.to('.about-image', { opacity: 1, y: 0, rotationX: 0, duration: 1, ease: 'power2.out', delay: 0.2 });
                break;
            case 2: // 个人作品部分
                gsap.to('.project-card', { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power2.out', stagger: 0.2 });
                break;
            case 3: // 联系方式部分
                gsap.to('.contact-text', { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power2.out' });
                gsap.to('.contact-form', { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power2.out', delay: 0.2 });
                gsap.to('.contact-info', { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power2.out', delay: 0.4 });
                break;
        }
    }

    // 初始化第一个部分的动画
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
function initHeart() {
    const svg = document.getElementById("heartSvg");
    const spacing = 1.5;
    const radius = 0.4;
    const centerX = 50;
    const centerY = 50;

    const cols = Math.floor(100 / spacing);
    const rows = Math.floor(100 / spacing);

    function isInsideHeart(x, y) {
        x = (x - 50) / 25;
        y = (y - 50) / 25;

        return Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y < 0;
    }

    for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
            const x = i * spacing;
            const y = j * spacing;

            if (!isInsideHeart(x, y)) continue;

            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", x);
            circle.setAttribute("cy", y);
            circle.setAttribute("r", radius);
            circle.setAttribute("fill", "#ad1c42");
            circle.style.opacity = 0.2;

            svg.appendChild(circle);

            const distToCenter = Math.hypot(x - centerX, y - centerY);
            const delay = distToCenter * 0.03;

            gsap.to(circle, {
                scale: 2,
                opacity: 0.8,
                duration: 1,
                delay: delay,
                repeat: -1,
                yoyo: true,
                transformOrigin: "center center",
                ease: "sine.inOut"
            });
        }
    }
}

/**
 * 初始化
 */
document.addEventListener('DOMContentLoaded', function () {
    initEmail();
    initCursor();
    initHorizontalScroll();
    initIcpInfo();
    initHeart();
});