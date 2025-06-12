/**
 * 移动端专用脚本 - 垂直滚动版本
 */

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
 * 移动端垂直滚动导航
 */
function initMobileNavigation() {
    const sections = document.querySelectorAll('.section');
    const navDots = document.querySelectorAll('.nav-dot');

    // 隐藏导航点（移动端不需要）
    navDots.forEach(dot => {
        dot.style.display = 'none';
    });

    // 简单的滚动到指定部分函数
    function scrollToSection(index) {
        if (sections[index]) {
            sections[index].scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    // 如果需要的话，可以添加导航点击事件
    navDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            scrollToSection(index);
        });
    });
}

/**
 * 移动端触控反馈
 */
function initMobileTouchFeedback() {
    const touchElements = document.querySelectorAll('.hover-element');

    touchElements.forEach(element => {
        // 触摸开始
        element.addEventListener('touchstart', function (e) {
            e.preventDefault();
            this.style.transform = 'scale(0.95)';
            this.style.opacity = '0.8';
        });

        // 触摸结束
        element.addEventListener('touchend', function (e) {
            e.preventDefault();
            this.style.transform = 'scale(1)';
            this.style.opacity = '1';
        });

        // 触摸取消
        element.addEventListener('touchcancel', function (e) {
            this.style.transform = 'scale(1)';
            this.style.opacity = '1';
        });
    });
}

/**
 * 移动端滚动动画（简化版本）
 */
function initMobileScrollAnimations() {
    // 创建简单的滚动触发动画
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');

                // 根据不同部分添加特定动画
                const sectionId = entry.target.id;
                switch (sectionId) {
                    case 'hero':
                        animateHero();
                        break;
                    case 'about':
                        animateAbout();
                        break;
                    case 'projects':
                        animateProjects();
                        break;
                    case 'contact':
                        animateContact();
                        break;
                }
            }
        });
    }, observerOptions);

    // 观察所有section
    document.querySelectorAll('.section').forEach(section => {
        observer.observe(section);
    });
}

/**
 * 移动端主页动画
 */
function animateHero() {
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroButtons = document.querySelector('.hero-cta');

    if (heroTitle) {
        heroTitle.style.opacity = '1';
        heroTitle.style.transform = 'translateY(0)';
    }

    if (heroSubtitle) {
        setTimeout(() => {
            heroSubtitle.style.opacity = '1';
            heroSubtitle.style.transform = 'translateY(0)';
        }, 200);
    }

    if (heroButtons) {
        setTimeout(() => {
            heroButtons.style.opacity = '1';
            heroButtons.style.transform = 'translateY(0)';
        }, 400);
    }
}

/**
 * 移动端关于我动画
 */
function animateAbout() {
    const aboutTexts = document.querySelectorAll('.about-text');
    const aboutSkills = document.querySelector('.about-skills');
    const aboutImage = document.querySelector('.about-image');

    aboutTexts.forEach((text, index) => {
        setTimeout(() => {
            text.style.opacity = '1';
            text.style.transform = 'translateY(0)';
        }, index * 100);
    });

    if (aboutSkills) {
        setTimeout(() => {
            aboutSkills.style.opacity = '1';
            aboutSkills.style.transform = 'translateY(0)';
        }, 300);
    }

    if (aboutImage) {
        setTimeout(() => {
            aboutImage.style.opacity = '1';
            aboutImage.style.transform = 'translateY(0)';
        }, 200);
    }
}

/**
 * 移动端项目动画
 */
function animateProjects() {
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 150);
    });
}

/**
 * 移动端联系方式动画
 */
function animateContact() {
    const contactText = document.querySelector('.contact-text');
    const contactForm = document.querySelector('.contact-form');
    const contactInfo = document.querySelector('.contact-info');

    if (contactText) {
        contactText.style.opacity = '1';
        contactText.style.transform = 'translateY(0)';
    }

    if (contactForm) {
        setTimeout(() => {
            contactForm.style.opacity = '1';
            contactForm.style.transform = 'translateY(0)';
        }, 200);
    }

    if (contactInfo) {
        setTimeout(() => {
            contactInfo.style.opacity = '1';
            contactInfo.style.transform = 'translateY(0)';
        }, 400);
    }
}

/**
 * 初始化备案信息
 */
function initIcpInfo() {
    const icpInfo = document.querySelector('.icp-info');
    if (icpInfo) {
        icpInfo.innerHTML = `© ${new Date().getFullYear()} Created by mcell 豫ICP备2025129196号-1`;
    }
}

/**
 * 移动端初始化
 */
document.addEventListener('DOMContentLoaded', function () {
    // 初始化基础功能
    initEmail();
    initMobileNavigation();
    initMobileTouchFeedback();
    initMobileScrollAnimations();
    initIcpInfo();

    // 立即显示主页内容
    setTimeout(() => {
        animateHero();
    }, 100);
});

// 防止页面缩放
document.addEventListener('touchstart', function (e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
});

let lastTouchEnd = 0;
document.addEventListener('touchend', function (e) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false); 