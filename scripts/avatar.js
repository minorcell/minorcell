const profilePic = document.getElementById('profile-pic');

let rotateDeg = 0;
let speed = 0;
let animationFrameId = null;


function rotate() {
    rotateDeg += speed;
    profilePic.style.transform = `rotate(${rotateDeg}deg)`;

    if (speed < 50) {
        speed += 0.1;
    }

    animationFrameId = requestAnimationFrame(rotate);
}

profilePic.addEventListener('mouseenter', () => {
    if (!animationFrameId) {
        speed = 1;
        rotate();
    }
});

profilePic.addEventListener('mouseleave', () => {
    const slowDown = () => {
        if (speed > 0) {
            speed -= 0.2;
            rotateDeg += speed;
            profilePic.style.transform = `rotate(${rotateDeg}deg)`;
            requestAnimationFrame(slowDown);
        } else {
            speed = 0;
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    };
    slowDown();
});

profilePic.addEventListener('click', () => {
    window.open('https://github.com/minorcell', '_blank');
});