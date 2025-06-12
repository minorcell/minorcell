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
 * 移动端触控反馈 - 修复版本
 */
function initMobileTouchFeedback() {
    // 只对特定的非交互元素添加触摸反馈
    const touchElements = document.querySelectorAll('.skill-tag, .about-image');

    touchElements.forEach(element => {
        // 触摸开始
        element.addEventListener('touchstart', function (e) {
            this.style.transform = 'scale(0.95)';
            this.style.opacity = '0.8';
        }, { passive: true });

        // 触摸结束
        element.addEventListener('touchend', function (e) {
            this.style.transform = 'scale(1)';
            this.style.opacity = '1';
        }, { passive: true });

        // 触摸取消
        element.addEventListener('touchcancel', function (e) {
            this.style.transform = 'scale(1)';
            this.style.opacity = '1';
        }, { passive: true });
    });

    // 为链接和按钮添加专门的触摸反馈，但不阻止默认行为
    const interactiveElements = document.querySelectorAll('a, button, .project-link, .social-link');
    interactiveElements.forEach(element => {
        element.addEventListener('touchstart', function (e) {
            // 不阻止默认行为，确保链接能正常工作
        }, { passive: true });

        element.addEventListener('touchend', function (e) {
            // 不阻止默认行为，确保链接能正常工作
        }, { passive: true });
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
    initIcpInfo();
});

// 只防止多点触控缩放，不干扰任何单点触摸交互
document.addEventListener('touchstart', function (e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });