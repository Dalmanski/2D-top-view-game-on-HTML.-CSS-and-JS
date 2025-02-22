document.addEventListener("DOMContentLoaded", () => {
    const player = document.getElementById("player");
    const container = document.getElementById("game-container");
    const message = document.getElementById("message");
    const coordinates = document.querySelector('.coordinates');
    const modalVN = document.getElementById("modal-vn");
    const modalVNImg = document.querySelector("#modal-vn img");
    const modalVNTitle = document.querySelector(".vn-title");
    const modalVNText = document.querySelector(".vn-text");
    const fButton = document.getElementById("f-btn");
    const upButton = document.getElementById("up-btn");
    const downButton = document.getElementById("down-btn");
    const leftButton = document.getElementById("left-btn");
    const rightButton = document.getElementById("right-btn");

    let soundPaperTurn = new Audio("Sounds\\paper.wav");

    let playerSpeed = 2, playerSize = player.offsetWidth;
    let playerPosX = 60, playerPosY = 250;
    let lastDirection = "right";
    let keys = {};
    let walls = [], dialogObjects = [];
    let isModalVNOpen = false;

    // Maintenance (0 false, 1 true)
    const showHitbox = 0, showCoordinate = 0;
    coordinates.style.display = showCoordinate ? "block" : "none";

    // Setup key event listeners once, converting keys to lowercase
    document.addEventListener("keydown", (e) => { keys[e.key.toLowerCase()] = true; });
    document.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

    container.addEventListener("mousemove", (e) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        coordinates.textContent = `X: ${Math.floor(x)}, Y: ${Math.floor(y)}`;
    });
    container.addEventListener("mouseleave", () => {
        coordinates.textContent = "Outside";
    });

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
        { x: 390, y: 235, width: 55, height: 30, object: "dialogObject", id: "Table 1" },
        { x: 590, y: 180, width: 55, height: 30, object: "dialogObject", id: "Table 2" },
        { x: 455, y: 300, width: 110, height: 30, object: "dialogObject", id: "Table 3" },
        { x: 375, y: 370, width: 30, height: 35, object: "dialogObject", id: "Old man" },
    ];

    function createObjects() {
        objectPositions.forEach((pos) => {
            let obj = document.createElement("div");
            obj.style.left = pos.x + "px";
            obj.style.top = pos.y + "px";
            obj.style.width = pos.width + "px";
            obj.style.height = pos.height + "px";
            obj.style.display = showHitbox ? "block" : "none";
            if (pos.object === "wall") {
                obj.classList.add("wall");
                walls.push(obj);
            } else if (pos.object === "dialogObject") {
                obj.classList.add("dialogObject");
                obj.dataset.id = pos.id;
                dialogObjects.push(obj);
            }
            container.appendChild(obj);
        });
    }

    // Main game loop via requestAnimationFrame
    function gameLoop() {
        movePlayer();
        requestAnimationFrame(gameLoop);
    }

    function movePlayer() {
        if (isModalVNOpen) return; // pause movement if modal is open

        let newX = playerPosX, newY = playerPosY;
        let moving = false;

        if (keys['w'] || keys['arrowup']) { newY -= playerSpeed; moving = true; }
        if (keys['s'] || keys['arrowdown']) { newY += playerSpeed; moving = true; }
        if (keys['a'] || keys['arrowleft']) { newX -= playerSpeed; moving = true; lastDirection = "left"; }
        if (keys['d'] || keys['arrowright']) { newX += playerSpeed; moving = true; lastDirection = "right"; }

        let dialogCheck = checkDialog(newX, newY);
        let canMove = !isColliding(newX, newY) && !dialogCheck.collision && isWithinBounds(newX, newY);

        if (canMove) {
            playerPosX = newX;
            playerPosY = newY;
            player.style.left = playerPosX + "px";
            player.style.top = playerPosY + "px";
        }

        player.style.backgroundImage = moving ? `url("Pictures/robot-run.gif")` : `url("Pictures/robot-idle.gif")`;

        if (dialogCheck.near) {
            message.textContent = `Press F to show "${dialogCheck.id}"`;
            fButton.style.display = "block";
        } else {
            message.textContent = "Explore!";
            fButton.style.display = "none";
        }

        if (keys['f'] && dialogCheck.near) openModalVN(dialogCheck.id);

        player.style.transform = lastDirection === "left" ? "scaleX(-1)" : "scaleX(1)";
    }

    // Button-based movement for touch/mouse
    let movementInterval;
    let isUsingButtons = false;

    function startMoving(direction) {
        if (!isUsingButtons) {
            isUsingButtons = true;
            movementInterval = setInterval(() => {
                if (isModalVNOpen) return;
                keys[directionKey(direction)] = true;
            }, 7);
        }
    }

    function stopMoving(direction) {
        clearInterval(movementInterval);
        isUsingButtons = false;
        keys[directionKey(direction)] = false;
    }

    function directionKey(direction) {
        switch (direction) {
            case "up": return "arrowup";
            case "down": return "arrowdown";
            case "left": return "arrowleft";
            case "right": return "arrowright";
            default: return "";
        }
    }

    upButton.addEventListener("mousedown", () => startMoving("up"));
    downButton.addEventListener("mousedown", () => startMoving("down"));
    leftButton.addEventListener("mousedown", () => startMoving("left"));
    rightButton.addEventListener("mousedown", () => startMoving("right"));

    upButton.addEventListener("mouseup", () => stopMoving("up"));
    downButton.addEventListener("mouseup", () => stopMoving("down"));
    leftButton.addEventListener("mouseup", () => stopMoving("left"));
    rightButton.addEventListener("mouseup", () => stopMoving("right"));

    upButton.addEventListener("touchstart", (e) => { e.preventDefault(); startMoving("up"); });
    downButton.addEventListener("touchstart", (e) => { e.preventDefault(); startMoving("down"); });
    leftButton.addEventListener("touchstart", (e) => { e.preventDefault(); startMoving("left"); });
    rightButton.addEventListener("touchstart", (e) => { e.preventDefault(); startMoving("right"); });

    upButton.addEventListener("touchend", () => stopMoving("up"));
    downButton.addEventListener("touchend", () => stopMoving("down"));
    leftButton.addEventListener("touchend", () => stopMoving("left"));
    rightButton.addEventListener("touchend", () => stopMoving("right"));

    fButton.addEventListener("mouseup", () => {
        const currentInteraction = checkDialog(playerPosX, playerPosY);
        if (currentInteraction.near) openModalVN(currentInteraction.id);
    });
    fButton.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const currentInteraction = checkDialog(playerPosX, playerPosY);
        if (currentInteraction.near) openModalVN(currentInteraction.id);
    });

    // Start the game loop
    requestAnimationFrame(gameLoop);

    async function openModalVN(id) {
        isModalVNOpen = true;  // pause movement
        modalVNImg.src = "";
        modalVNTitle.textContent = "";
        modalVNText.textContent = "";
        modalVN.style.display = "flex";
        modalVN.classList.add("fade-in");
        soundPaperTurn.currentTime = 0;
        soundPaperTurn.play();

        if (id === "Table 1") {
            modalVNImg.src = "https://scontent.fceb1-3.fna.fbcdn.net/v/t39.30808-6/292985382_437572181710197_8080532175229102949_n.png?_nc_cat=104&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeEJ87tKG-OJ7LjEQ3ax42_qin0CTrvmSASKfQJOu-ZIBOtDytUAEBGa8FXS5kDURi-KY7vhsCIfXuNsGf7kxKrZ&_nc_ohc=OFeaxSOxsasQ7kNvgE4Uhhb&_nc_oc=AdirPIVCWBjAmEtmdRXsARi6yUSLK5bHlKtk11neezsJTTMs496yrqJFtehT0l5M1KA&_nc_zt=23&_nc_ht=scontent.fceb1-3.fna&_nc_gid=AAdJewYzxTTM3MKvmrJUKpN&oh=00_AYC2kX7dKOuAXGI2SqW6MVpEBmW5_UqGBrCYa4WE6wpmeA&oe=67BF4B67";
            modalVNTitle.textContent = "My Geometry Dash Cover Picture!";
            modalVNText.textContent = "This is made inside Geometry Dash! No import image allowed in GD.";
        } else if (id === "Table 2") {
            modalVNTitle.textContent = "Lorem Ipsum";
            modalVNText.textContent = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";
        } else if (id === "Table 3") {
            modalVNImg.src = "https://scontent.fceb1-1.fna.fbcdn.net/v/t39.30808-6/448571253_905922861548676_9215265388986504411_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFIKcPWzVpHIUDYl5mZ4NzrDup2N2UfZbwO6nY3ZR9lvEqTI9JO_Sa3tD9XPdKK2mdDqbVEvbRad-PBxsGA4Ksm&_nc_ohc=-Nb8fZbdV1sQ7kNvgH94okK&_nc_oc=AdhTKU9ETpyn0aNhHwhhHLMCnxUAdBlea3RAbvcTlZvDkin2L8sXprclRLn5WCmlQX0&_nc_zt=23&_nc_ht=scontent.fceb1-1.fna&_nc_gid=A7djgaFL6sw2Fyh3xLbpO1_&oh=00_AYA4z37IX0pJl1Jw1KNfy7sZJdoKSfDBe4uOMU9PTQPUFg&oe=67BF66A5";
            modalVNTitle.textContent = "My Gacha Games wins 50/50!";
            modalVNText.textContent = "This part always win 50/50 on any Gacha games.";
        } else if (id === "Old man") {
            modalVNTitle.textContent = "Hey you... Why did you make this?";
            modalVNText.textContent = "It's a top secret old man.";
        }
    }

    modalVN.addEventListener("click", () => {
        modalVN.style.display = "none";
        modalVN.classList.remove("fade-in");
        isModalVNOpen = false;
    });
    document.addEventListener("keydown", (e) => {
        if (isModalVNOpen) {
            modalVN.style.display = "none";
            modalVN.classList.remove("fade-in");
            isModalVNOpen = false;
        }
    });

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

    function checkDialog(x, y) {
        let playerRect = { x, y, width: playerSize, height: playerSize };
        let result = { collision: false, near: false, id: null };

        dialogObjects.forEach(obj => {
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
                if (!showHitbox) obj.style.display = "block";
                obj.style.animation = "blink 1s infinite";
            } else {
                if (!showHitbox) obj.style.display = "none";
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
        return (
            x >= 0 &&
            y >= 0 &&
            x + playerSize <= containerWidth &&
            y + playerSize <= containerHeight
        );
    }

    createObjects();
});
