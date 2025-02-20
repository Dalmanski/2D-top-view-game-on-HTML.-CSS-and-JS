document.addEventListener("DOMContentLoaded", () => {
    const player = document.getElementById("player");
    const container = document.getElementById("game-container");
    const message = document.getElementById("message");
    const coordinates = document.querySelector('.coordinates');
    const modal = document.getElementById("modal");
    const modalImg = document.querySelector("#modal img");
    const modalText = document.getElementById("visual-novel-box");

    const playerSpeed = 2, playerSize = player.offsetWidth;
    let playerPosX = 60, playerPosY = 250;

    let lastDirection = "right";
    let keys = {};
    let walls = [], interactiveObjects = [];

    // Maintenance
    const showHitbox = 0; // 0 false, 1 true

    // To show coordinates on the top-left
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        coordinates.textContent = `X: ${Math.floor(x)}, Y: ${Math.floor(y)}`;
    });

    container.addEventListener('mouseleave', () => {
        coordinates.textContent = "Outside";
    });

    document.addEventListener("keydown", (e) => keys[e.key] = true);
    document.addEventListener("keyup", (e) => keys[e.key] = false);

    // img src: https://images.app.goo.gl/56XvUQCpmG2J8oQx7
    const floorImage = new Image();
    floorImage.src = "Pictures/floor.png";

    floorImage.onload = function () {
        const scaleFactor = 1.5;
        const newWidth = floorImage.width * scaleFactor;
        const newHeight = floorImage.height * scaleFactor;

        container.style.width = newWidth + "px";
        container.style.height = newHeight + "px";
        container.style.backgroundImage = `url('${floorImage.src}')`;
    };

    const objectPositions = [
        { x: 180, y: 220, width: 110, height: 150, object: "wall" },
        { x: 715, y: 220, width: 110, height: 150, object: "wall" },
        { x: 0, y: 0, width: 1045, height: 50, object: "wall" },
        { x: 0, y: 530, width: 1045, height: 50, object: "wall" },
        { x: 390, y: 235, width: 55, height: 30, object: "interactiveObject", name: "dialog1" },
        { x: 590, y: 180, width: 55, height: 30, object: "interactiveObject", name: "dialog2" },
        { x: 455, y: 300, width: 110, height: 30, object: "interactiveObject", name: "dialog3" },
        { x: 375, y: 370, width: 30, height: 35, object: "interactiveObject", name: "dialog4" },
    ];

    function createObjects() {
        objectPositions.forEach(pos => {
            let obj = document.createElement("div");
            obj.style.left = pos.x + "px";
            obj.style.top = pos.y + "px";
            obj.style.width = pos.width + "px";
            obj.style.height = pos.height + "px";

            obj.style.display = showHitbox ? "block" : "none";

            if (pos.object === "wall") {
                obj.classList.add("wall");
                walls.push(obj);
            } else if (pos.object === "interactiveObject") {
                obj.classList.add("interactive");
                obj.dataset.id = pos.name;
                interactiveObjects.push(obj);
            }

            container.appendChild(obj);
        });
    }

    function movePlayer() {
        let newX = playerPosX, newY = playerPosY;
        let moving = false;

        if (keys['w'] || keys['ArrowUp']) { newY -= playerSpeed; moving = true; }
        if (keys['s'] || keys['ArrowDown']) { newY += playerSpeed; moving = true; }
        if (keys['a'] || keys['ArrowLeft']) { newX -= playerSpeed; moving = true; lastDirection = "left"; }
        if (keys['d'] || keys['ArrowRight']) { newX += playerSpeed; moving = true; lastDirection = "right"; }

        let interactionCheck = checkInteraction(newX, newY);
        let canMove = !isColliding(newX, newY) && !interactionCheck.collision && isWithinBounds(newX, newY);

        if (canMove) {
            playerPosX = newX;
            playerPosY = newY;
            player.style.left = playerPosX + "px";
            player.style.top = playerPosY + "px";
        }

        player.style.backgroundImage = moving ? `url("Pictures/robot-run.gif")` : `url("Pictures/robot-idle.gif")`;

        if (interactionCheck.near) {
            message.textContent = `Press F to show "${interactionCheck.id}"`;
        } else if (canMove) {
            message.textContent = "Explore!";
        }

        if (keys['f'] && interactionCheck.near) openModal(interactionCheck.id);

        player.style.transform = lastDirection === "left" ? "scaleX(-1)" : "scaleX(1)";

        requestAnimationFrame(movePlayer); // This will loop movePlayer()
    }

    function openModal(id) {
        if (id === "dialog1") {
            modalImg.src = "Pictures/floor.png";
            modalText.textContent = "This is dialog 1's description.";
        } else if (id === "dialog2") {
            modalImg.src = "Pictures/floor.png";
            modalText.textContent = "This is dialog 2's description.";
        } else if (id === "dialog3") {
            modalImg.src = "Pictures/floor.png";
            modalText.textContent = "This is dialog 3's description.";
        } else if (id === "dialog4") {
            modalImg.src = "Pictures/floor.png";
            modalText.textContent = "This is dialog 4's description.";
        }
        modal.style.display = "flex";
    }

    // Only close the modal with a click (or a dedicated key) so movement keys aren't interfered with.
    modal.addEventListener("click", () => { modal.style.display = "none"; });
    // Removed the keydown event that was hiding the modal immediately

    function isColliding(x, y) {
        let playerRect = { x, y, width: playerSize, height: playerSize };
        return walls.some(wall => {
            let wallRect = {
                x: parseInt(wall.style.left),
                y: parseInt(wall.style.top),
                width: parseInt(wall.style.width),
                height: parseInt(wall.style.height)
            };
            return checkCollision(playerRect, wallRect);
        });
    }

    function checkInteraction(x, y) {
        let playerRect = { x, y, width: playerSize, height: playerSize };
        let result = { collision: false, near: false, id: null };

        interactiveObjects.forEach(obj => {
            let objRect = {
                x: parseInt(obj.style.left),
                y: parseInt(obj.style.top),
                width: parseInt(obj.style.width),
                height: parseInt(obj.style.height)
            };

            if (checkCollision(playerRect, objRect)) {
                result.collision = true;
                result.id = obj.dataset.id;
            } else if (isNear(playerRect, objRect, 2)) {
                result.near = true;
                result.id = obj.dataset.id;
                obj.style.display = "block";
                obj.style.animation = "blink 1s infinite";
            } else {
                obj.style.display = "none";
                obj.style.animation = "none";
            }
        });

        return result;
    }

    function checkCollision(rect1, rect2) {
        return !(rect1.x + rect1.width <= rect2.x ||
            rect1.x >= rect2.x + rect2.width ||
            rect1.y + rect1.height <= rect2.y ||
            rect1.y >= rect2.y + rect2.height);
    }

    function isNear(rect1, rect2, buffer) {
        return (
            rect1.x + rect1.width + buffer >= rect2.x &&
            rect1.x - buffer <= rect2.x + rect2.width &&
            rect1.y + rect1.height + buffer >= rect2.y &&
            rect1.y - buffer <= rect2.y + rect2.height
        );
    }

    function isWithinBounds(x, y) {
        let containerWidth = container.clientWidth;
        let containerHeight = container.clientHeight;
        let playerWidth = playerSize;
        let playerHeight = playerSize;

        return (
            x >= 0 &&
            y >= 0 &&
            x + playerWidth <= containerWidth &&
            y + playerHeight <= containerHeight
        );
    }

    createObjects();
    movePlayer();
});
