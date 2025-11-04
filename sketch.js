let fontRegular;
let playButton, resetButton, instructionsButton, overlapButton, sphereButton, labelButton, spinButton;
let titleDiv, footerDiv, instructionsPopup;
let atoms = [];
let state = "idle";
let progress = 0;
let bondingProgress = 0;
let cloudRotationAngle = 0;
const slowSpinSpeed = 0.025;
const fastSpinSpeed = 0.3;
const sphereRotationSpeed = 0.02;
let oSphereRotation = 0;
let hSphereRotation = 0;

// Biến trạng thái
let showLabels = true;
let showSpheres = false;
let showClouds = false;
let is3DView = false;
let bentTransitionProgress = 0;

let isElectronSpinning = true;
let electronSpinAngle = 0;

// Cấu hình cho nguyên tử O và H
const oInnerRadius = 50; // Lớp electron trong của O
const oOuterRadius = 90; // Lớp electron ngoài của O
const hOuterRadius = 60; // Lớp electron của H
const labelOffset = 30;

// Bán kính đám mây electron
const oCloudRadius = oOuterRadius - 5;
const hCloudRadius = hOuterRadius - 5;

const initialShellGap = 200;
const bondedShellOverlap = 20;
const bondDistance = (oOuterRadius + hOuterRadius) - bondedShellOverlap;

const initialDistance = oOuterRadius + initialShellGap + hOuterRadius;
const sharedElectronSeparation = 18;

let panX = 0;
let panY = 0;
let previousMouseX, previousMouseY;

function preload() {
    fontRegular = loadFont('https://fonts.gstatic.com/s/opensans/v27/mem8YaGs126MiZpBA-UFVZ0e.ttf');
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    background(0);
    perspective(PI / 3, width / height, 0.1, 4000);

    smooth();
    textFont(fontRegular);
    textAlign(CENTER, CENTER);
    noStroke();

    titleDiv = createDiv("MÔ PHỎNG LIÊN KẾT CỘNG HOÁ TRỊ TRONG PHÂN TỬ H₂O");
    titleDiv.style("position", "absolute");
    titleDiv.style("top", "10px");
    titleDiv.style("width", "100%");
    titleDiv.style("text-align", "center");
    titleDiv.style("font-size", "18px");
    titleDiv.style("color", "#fff");
    titleDiv.style("text-shadow", "2px 2px 5px rgba(0,0,0,0.7)");
    titleDiv.style("font-family", "Arial");

    footerDiv = createDiv("© HÓA HỌC ABC");
    footerDiv.style("position", "absolute");
    footerDiv.style("bottom", "10px");
    footerDiv.style("width", "100%");
    footerDiv.style("text-align", "center");
    footerDiv.style("font-size", "16px");
    footerDiv.style("color", "#fff");
    footerDiv.style("text-shadow", "2px 2px 5px rgba(0,0,0,0.7)");
    footerDiv.style("font-family", "Arial");

    createUI();
    resetSimulation();
}

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function createUI() {
    playButton = createButton("▶ Play");
    styleButton(playButton);
    playButton.mousePressed(() => {
        if (state === "idle") {
            state = "animating";
            showSpheres = false;
            showClouds = false;
            is3DView = false;
            sphereButton.html("Bật lớp cầu");
            overlapButton.html("Bật xen phủ");
        }
    });

    spinButton = createButton("Tắt quay electron");
    styleButton(spinButton);
    spinButton.mousePressed(() => {
        isElectronSpinning = !isElectronSpinning;
        if (isElectronSpinning) {
            spinButton.html("Tắt quay electron");
        } else {
            spinButton.html("Bật quay electron");
        }
    });
    
    resetButton = createButton("↺ Reset");
    styleButton(resetButton);
    resetButton.mousePressed(() => {
        window.location.reload();
    });

    overlapButton = createButton("Bật xen phủ");
    styleButton(overlapButton);
    overlapButton.mousePressed(() => {
        if (state === "done") {
            showClouds = !showClouds;
            if (showClouds) {
                showSpheres = false;
                is3DView = false;
                overlapButton.html("Tắt xen phủ");
                sphereButton.html("Bật lớp cầu");
            } else {
                overlapButton.html("Bật xen phủ");
            }
        }
    });

    sphereButton = createButton("Bật lớp cầu");
    styleButton(sphereButton);
    sphereButton.mousePressed(() => {
        if (state !== "animating" && state !== "bonding") {
            showSpheres = !showSpheres;
            if (showSpheres) {
                showClouds = false;
                is3DView = true;
                bentTransitionProgress = 0;
                sphereButton.html("Tắt lớp cầu");
                overlapButton.html("Bật xen phủ");
            } else {
                is3DView = false;
                bentTransitionProgress = 0;
                sphereButton.html("Bật lớp cầu");
            }
        }
    });
    
    labelButton = createButton("Tắt nhãn");
    styleButton(labelButton);
    labelButton.mousePressed(() => {
        showLabels = !showLabels;
        if (showLabels) {
            labelButton.html("Tắt nhãn");
        } else {
            labelButton.html("Bật nhãn");
        }
    });

    instructionsButton = createButton("Hướng dẫn");
    styleInstructionsButton(instructionsButton);
    instructionsButton.mousePressed(() => {
        instructionsPopup.style('display', 'block');
    });

    instructionsPopup = createDiv();
    instructionsPopup.id('instructions-popup');
    instructionsPopup.style('position', 'fixed');
    instructionsPopup.style('top', '50%');
    instructionsPopup.style('left', '50%');
    instructionsPopup.style('transform', 'translate(-50%, -50%)');
    instructionsPopup.style('background-color', 'rgba(0, 0, 0, 0.85)');
    instructionsPopup.style('border-radius', '12px');
    instructionsPopup.style('padding', '20px');
    instructionsPopup.style('color', '#fff');
    instructionsPopup.style('font-family', 'Arial');
    instructionsPopup.style('z-index', '1000');
    instructionsPopup.style('box-shadow', '0 4px 8px rgba(0, 0, 0, 0.2)');
    instructionsPopup.style('display', 'none');

    let popupContent = '<h2 style="font-size: 24px; margin-bottom: 15px; text-align: center;">Hướng dẫn sử dụng</h2>';
    popupContent += '<ul style="list-style-type: none; padding: 0;">';
    popupContent += '<li style="margin-bottom: 10px;">• Nhấn nút "Play" để bắt đầu quá trình mô phỏng liên kết cộng hóa trị.</li>';
    popupContent += '<li style="margin-bottom: 10px;">• Sau khi mô phỏng hoàn tất, bạn có thể sử dụng chuột để xoay và xem mô hình từ các góc khác nhau.</li>';
    popupContent += '<li style="margin-bottom: 10px;">• Giữ phím Ctrl và kéo chuột trái để di chuyển toàn bộ mô hình trên màn hình.</li>';
    popupContent += '<li style="margin-bottom: 10px;">• Sử dụng con lăn chuột để phóng to hoặc thu nhỏ.</li>';
    popupContent += '<li style="margin-bottom: 10px;">• Nhấn nút "Reset" để quay lại trạng thái ban đầu.</li>';
    popupContent += '<li style="margin-bottom: 10px;">• Nhấn nút "Bật xen phủ" để hiển thị đám mây electron liên kết.</li>';
    popupContent += '<li style="margin-bottom: 10px;">• Nhấn nút "Bật lớp cầu" để hiển thị lớp electron hóa trị dưới dạng mặt cầu.</li>';
    popupContent += '<li style="margin-bottom: 10px;">• Nhấn nút "Bật/Tắt quay electron" để dừng/tiếp tục chuyển động của electron.</li>';
    popupContent += '</ul>';
    popupContent += '<button id="closePopup" style="display: block; width: 100%; padding: 10px; margin-top: 20px; font-size: 16px; border: none; border-radius: 6px; background-color: #36d1dc; color: #fff; cursor: pointer;">Đóng</button>';
    
    instructionsPopup.html(popupContent);

    setTimeout(() => {
        let closeBtn = document.getElementById('closePopup');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                instructionsPopup.style('display', 'none');
            });
        }
    }, 100);

    positionButtons();
}

function styleButton(btn) {
    btn.style("width", "130px");
    btn.style("height", "30px");
    btn.style("padding", "0px");
    btn.style("font-size", "12px");
    btn.style("border-radius", "6px");
    btn.style("color", "#fff");
    btn.style("cursor", "pointer");
    btn.style("transition", "all 0.2s ease-in-out");
    btn.style("font-family", "Arial");
    btn.style("box-shadow", "none");
    btn.style("transform", "scale(1)");
    btn.style("border", "none");
    btn.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
    
    btn.mouseOver(() => {
        btn.style("background", "linear-gradient(145deg, #fc5c7d, #6a82fb)");
    });
    btn.mouseOut(() => {
        btn.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
    });
    btn.mousePressed(() => {
        btn.style("background", "#36d1dc");
        btn.style("transform", "scale(0.95)");
    });
    btn.mouseReleased(() => {
        btn.style("background", "linear-gradient(145deg, #fc5c7d, #6a82fb)");
        btn.style("transform", "scale(1)");
    });
}

function styleInstructionsButton(btn) {
    btn.style("width", "130px");
    btn.style("height", "30px");
    btn.style("padding", "0px");
    btn.style("font-size", "12px");
    btn.style("border-radius", "6px");
    btn.style("color", "#fff");
    btn.style("cursor", "pointer");
    btn.style("transition", "all 0.2s ease-in-out");
    btn.style("font-family", "Arial");
    btn.style("box-shadow", "none");
    btn.style("transform", "scale(1)");
    btn.style("background", "rgba(0,0,0,0)");
    btn.style("border", "1px solid #fff");
    
    btn.mouseOver(() => {
        btn.style("background", "#fff");
        btn.style("color", "#000");
    });
    btn.mouseOut(() => {
        btn.style("background", "rgba(0,0,0,0)");
        btn.style("color", "#fff");
    });
    btn.mousePressed(() => {
        btn.style("background", "#36d1dc");
        btn.style("color", "#fff");
        btn.style("transform", "scale(0.95)");
    });
    btn.mouseReleased(() => {
        btn.style("background", "#fff");
        btn.style("color", "#000");
        btn.style("transform", "scale(1)");
    });
}

function positionButtons() {
    playButton.position(20, 20);
    spinButton.position(20, 60);
    overlapButton.position(20, 100);
    sphereButton.position(20, 140);
    labelButton.position(20, 180);
    resetButton.position(20, 220); 
    instructionsButton.position(20, 260);
}

function resetSimulation() {
    atoms = [];
    // Tạo nguyên tử O ở trung tâm với màu electron xanh lá cây sáng
    atoms.push(new Atom(0, 0, "O", 8, [2, 6], color(0, 255, 100)));

    // Vị trí ban đầu của 2 nguyên tử H (nằm ngang 2 bên)
    const hInitialPositions = [
        createVector(-initialDistance, 0, 0),
        createVector(initialDistance, 0, 0)
    ];

    // Góc liên kết H-O-H là 104.5 độ
    const bondAngle = radians(104.5);
    const halfAngle = bondAngle / 2;
    
    // Vị trí cuối cùng của 2 nguyên tử H tạo góc 104.5 độ (dạng chữ V - bent shape)
    const hFinalPositions2D = [
        createVector(-bondDistance * cos(halfAngle), bondDistance * sin(halfAngle), 0),
        createVector(bondDistance * cos(halfAngle), bondDistance * sin(halfAngle), 0)
    ];

    // Vị trí 3D giống như 2D (H2O là phân tử phẳng)
    const hFinalPositions3D = [
        createVector(-bondDistance * cos(halfAngle), bondDistance * sin(halfAngle), 0),
        createVector(bondDistance * cos(halfAngle), bondDistance * sin(halfAngle), 0)
    ];

    atoms.push(new Atom(hInitialPositions[0].x, hInitialPositions[0].y, "H", 1, [1], color(255, 255, 255), hFinalPositions3D[0]));
    atoms.push(new Atom(hInitialPositions[1].x, hInitialPositions[1].y, "H", 1, [1], color(255, 255, 255), hFinalPositions3D[1]));

    state = "idle";
    progress = 0;
    bondingProgress = 0;
    cloudRotationAngle = 0;
    oSphereRotation = 0;
    hSphereRotation = 0;
    panX = 0;
    panY = -100;
    previousMouseX = mouseX;
    previousMouseY = mouseY;
    bentTransitionProgress = 0;

    showClouds = false;
    showSpheres = false;
    is3DView = false;
    overlapButton.html("Bật xen phủ");
    sphereButton.html("Bật lớp cầu");
    
    showLabels = true;
    labelButton.html("Tắt nhãn");
    
    isElectronSpinning = true;
    spinButton.html("Tắt quay electron");
    electronSpinAngle = 0;
}

function draw() {
    background(0);

    if (keyIsDown(17) && mouseIsPressed) {
        panX += (mouseX - pmouseX);
        panY += (mouseY - pmouseY);
        previousMouseX = mouseX;
        previousMouseY = mouseY;
    } else {
        orbitControl();
    }

    translate(panX, panY);

    ambientLight(80);
    if (!showSpheres) {
        pointLight(255, 255, 255, 0, 0, 300);
    }

    const oAtom = atoms.find(a => a.label === "O");
    const hAtoms = atoms.filter(a => a.label === "H");

    if (state === "animating") {
        progress += 0.01;
        let t_move = easeInOutQuad(progress);

        if (progress >= 1) {
            progress = 1;
            state = "bonding";
        }

        hAtoms.forEach(hAtom => {
            const initialPos = hAtom.initialPos;
            const finalPos = hAtom.finalPos;
            hAtom.pos.x = lerp(initialPos.x, finalPos.x, t_move);
            hAtom.pos.y = lerp(initialPos.y, finalPos.y, t_move);
        });

    } else if (state === "bonding") {
        bondingProgress += 0.02;
        if (bondingProgress >= 1) {
            bondingProgress = 1;
            state = "done";
        }
    }
    
    if (is3DView && state === "done") {
        if (bentTransitionProgress < 1) {
            bentTransitionProgress += 0.02;
        } else {
            bentTransitionProgress = 1;
        }
        let t_bent = easeInOutQuad(bentTransitionProgress);
        hAtoms.forEach(hAtom => {
            hAtom.pos = p5.Vector.lerp(hAtom.donePos, hAtom.bentPos, t_bent);
        });
    } else if (!is3DView && state === "done") {
        if (bentTransitionProgress > 0) {
            bentTransitionProgress -= 0.02;
        } else {
            bentTransitionProgress = 0;
        }
        let t_bent = easeInOutQuad(bentTransitionProgress);
        hAtoms.forEach(hAtom => {
            hAtom.pos = p5.Vector.lerp(hAtom.donePos, hAtom.bentPos, t_bent);
        });
    }
    
    if (isElectronSpinning) {
        electronSpinAngle += slowSpinSpeed;
        cloudRotationAngle += fastSpinSpeed;
        oSphereRotation += sphereRotationSpeed;
        hSphereRotation += sphereRotationSpeed;
    }

    for (let atom of atoms) {
        push();
        translate(atom.pos.x, atom.pos.y, atom.pos.z);
        atom.show(bondingProgress, state, electronSpinAngle);
        pop();
    }
    
    if (state !== "idle" && state !== "animating" && !showSpheres) {
        drawBondingElectrons();
    }

    if (showClouds) {
        drawElectronClouds();
    }
    if (showSpheres) {
        drawElectronSpheres();
    }

    if (showLabels) {
        drawLabels();
    }
}

function drawLabels() {
    const oAtom = atoms.find(a => a.label === "O");
    const hAtoms = atoms.filter(a => a.label === "H");
    
    if (!oAtom || hAtoms.length === 0) return;

    drawBillboardText(oAtom.label, oAtom.pos.x, oAtom.pos.y + oOuterRadius + labelOffset, oAtom.pos.z);
    
    hAtoms.forEach(hAtom => {
        drawBillboardText(hAtom.label, hAtom.pos.x, hAtom.pos.y + hOuterRadius + labelOffset, hAtom.pos.z);
    });
}

function drawBillboardText(textStr, x, y, z) {
    push();
    translate(x, y, z);
    const orbitCam = p5.instance._curCamera;
    if (orbitCam) {
        rotateX(-orbitCam.cameraX);
        rotateY(-orbitCam.cameraY);
    }
    fill(255);
    textSize(20);
    text(textStr, 0, 0);
    pop();
}

function drawBondingElectrons() {
    if (state === "bonding" || state === "done") {
        const electronSize = 6;
        let t_bonding = easeInOutQuad(bondingProgress);

        const oAtom = atoms.find(a => a.label === "O");
        const hAtoms = atoms.filter(a => a.label === "H");

        if (!oAtom) return;

        let bondingElectrons_O = oAtom.shells.at(-1).filter(e => e.isShared);
        
        for(let i=0; i<hAtoms.length; i++) {
            let h = hAtoms[i];
            let e_H = h.shells.at(-1).find(el => el.isShared);
            
            let e_O;
            if(h.initialPos.x < 0) {
                e_O = bondingElectrons_O.find(e => abs(degrees(e.angle) - 180) < 1);
            } else {
                e_O = bondingElectrons_O.find(e => abs(degrees(e.angle) - 0) < 1);
            }
            
            if(e_O) {
                let bondingPoint = getOverlapCenter(oAtom.pos, h.pos);

                let dirVector = p5.Vector.sub(h.pos, oAtom.pos).normalize();

                let perpVector;
                if (is3DView) {
                    perpVector = dirVector.cross(createVector(0,0,1)).normalize();
                } else {
                    perpVector = createVector(-dirVector.y, dirVector.x, 0);
                }
                
                let finalPos_O = p5.Vector.add(bondingPoint, p5.Vector.mult(perpVector, sharedElectronSeparation / 2));
                let finalPos_H = p5.Vector.add(bondingPoint, p5.Vector.mult(perpVector, -sharedElectronSeparation / 2));

                let pos_O = p5.Vector.lerp(e_O.initialPos, finalPos_O, t_bonding);
                let pos_H = p5.Vector.lerp(e_H.initialPos, finalPos_H, t_bonding);

                push();
                translate(pos_O.x, pos_O.y, pos_O.z);
                fill(oAtom.electronCol);
                sphere(electronSize);
                
                // Vẽ nhãn "-" cho electron của O
                if (showLabels) {
                    push();
                    translate(0, 0, electronSize + 2);
                    fill(255, 255, 0);
                    textSize(12);
                    text("-", 0, 0);
                    pop();
                }
                pop();
                
                push();
                translate(pos_H.x, pos_H.y, pos_H.z);
                fill(h.electronCol);
                sphere(electronSize);
                
                // Vẽ nhãn "-" cho electron của H
                if (showLabels) {
                    push();
                    translate(0, 0, electronSize + 2);
                    fill(255, 255, 0);
                    textSize(12);
                    text("-", 0, 0);
                    pop();
                }
                pop();
            }
        }
    }
}

function getOverlapCenter(oPos, hPos) {
    const totalDistance = p5.Vector.dist(oPos, hPos);
    const overlapStartFromO = totalDistance - hOuterRadius;
    const overlapEndFromO = oOuterRadius;
    const overlapMidPoint = (overlapStartFromO + overlapEndFromO) / 2;
    const dirVector = p5.Vector.sub(hPos, oPos).normalize();
    return p5.Vector.add(oPos, p5.Vector.mult(dirVector, overlapMidPoint));
}

function drawElectronClouds() {
    const oAtom = atoms.find(a => a.label === "O");
    const hAtoms = atoms.filter(a => a.label === "H");

    const orbitalWidth = 12;

    let oColor = oAtom.electronCol;
    let hColor = hAtoms[0].electronCol;
    let blendedColor = lerpColor(oColor, hColor, 0.5);
    blendedColor.setAlpha(255);

    push();
    translate(oAtom.pos.x, oAtom.pos.y, oAtom.pos.z);
    rotateZ(cloudRotationAngle);
    noStroke();
    fill(blendedColor);
    torus(oCloudRadius, orbitalWidth, 12, 12);
    pop();

    hAtoms.forEach(hAtom => {
        push();
        translate(hAtom.pos.x, hAtom.pos.y, hAtom.pos.z);
        rotateZ(cloudRotationAngle);
        noStroke();
        fill(blendedColor);
        torus(hCloudRadius, orbitalWidth, 12, 12);
        pop();
    });
}

function drawElectronSpheres() {
    const oAtom = atoms.find(a => a.label === "O");
    const hAtoms = atoms.filter(a => a.label === "H");

    if (!oAtom) return;

    ambientLight(80);

    let aA = frameCount * 0.010;
    let LAx = cos(aA) * 380;
    let LAy = sin(aA) * 240;
    directionalLight(140, 140, 140, LAx, LAy, -0.25);

    let aB = frameCount * 0.018 + PI / 4;
    let LBx = cos(aB) * 210;
    let LBy = sin(aB) * 170;
    directionalLight(90, 90, 90, -LBx, -LBy, 0.2);

    // Render O sphere
    push();
    translate(oAtom.pos.x, oAtom.pos.y, oAtom.pos.z);
    rotateY(oSphereRotation);
    noStroke();
    shininess(85);

    const or = red(oAtom.electronCol);
    const og = green(oAtom.electronCol);
    const ob = blue(oAtom.electronCol);

    ambientMaterial(or, og, ob);
    specularMaterial(min(255, or + 45), min(255, og + 45), min(255, ob + 45));

    let oOrbitalRadius = oOuterRadius;
    sphere(oOrbitalRadius, 60, 60);
    pop();

    // Render H spheres
    hAtoms.forEach(hAtom => {
        push();
        translate(hAtom.pos.x, hAtom.pos.y, hAtom.pos.z);
        rotateY(hSphereRotation);
        noStroke();
        shininess(85);

        const hr = red(hAtom.electronCol);
        const hg = green(hAtom.electronCol);
        const hb = blue(hAtom.electronCol);

        ambientMaterial(hr, hg, hb);
        specularMaterial(min(255, hr + 45), min(255, hg + 45), min(255, hb + 45));

        let hOrbitalRadius = hOuterRadius;
        sphere(hOrbitalRadius, 60, 60);
        pop();
    });
}

class Atom {
    constructor(x, y, label, protons, shellCounts, electronCol, bentPos = null) {
        this.pos = createVector(x, y, 0);
        this.initialPos = createVector(x, y, 0);
        this.label = label;
        this.protons = protons;
        this.shells = [];
        this.shellRadii = [];
        
        this.electronCol = electronCol;
        this.otherElectronCol = (this.label === "H") ? color(0, 255, 100) : color(255, 255, 255);
        this.isBonded = false;
        
        if (this.label === "H") {
            const hCount = atoms.filter(a => a.label === "H").length;
            this.labelId = hCount;
        }

        if (this.label === "O") {
            // Lớp electron trong (2 electron)
            this.shellRadii.push(oInnerRadius);
            let innerShellElectrons = [];
            for (let j = 0; j < 2; j++) {
                innerShellElectrons.push({
                    angle: (TWO_PI / 2) * j,
                    col: this.electronCol,
                    isShared: false,
                    initialPos: null
                });
            }
            this.shells.push(innerShellElectrons);

            // Lớp electron ngoài (6 electron)
            this.shellRadii.push(oOuterRadius);
            let outerShellElectrons = [];
            
            // 2 cặp electron không liên kết (phía trên và dưới)
            const nonBondingPairAngles = [
                radians(270) - radians(10), radians(270) + radians(10),  // Cặp dưới
                radians(90) - radians(10), radians(90) + radians(10)     // Cặp trên
            ];
            
            // 2 electron tham gia liên kết (trái và phải)
            const bondingPairAngles = [radians(180), radians(0)];
            
            outerShellElectrons.push({ angle: bondingPairAngles[0], col: this.electronCol, isShared: true, initialPos: null });
            outerShellElectrons.push({ angle: bondingPairAngles[1], col: this.electronCol, isShared: true, initialPos: null });
            outerShellElectrons.push({ angle: nonBondingPairAngles[0], col: this.electronCol, isShared: false, initialPos: null });
            outerShellElectrons.push({ angle: nonBondingPairAngles[1], col: this.electronCol, isShared: false, initialPos: null });
            outerShellElectrons.push({ angle: nonBondingPairAngles[2], col: this.electronCol, isShared: false, initialPos: null });
            outerShellElectrons.push({ angle: nonBondingPairAngles[3], col: this.electronCol, isShared: false, initialPos: null });
            
            this.shells.push(outerShellElectrons);
        } else {
            // Hydrogen - 1 electron
            this.shellRadii.push(hOuterRadius);
            let shellElectrons = [];
            for (let j = 0; j < shellCounts[0]; j++) {
                shellElectrons.push({
                    angle: (TWO_PI / shellCounts[0]) * j,
                    col: electronCol,
                    isShared: true,
                    initialPos: null
                });
            }
            this.shells.push(shellElectrons);
        }
        
        if (this.label === "H") {
            this.finalPos = p5.Vector.mult(p5.Vector.sub(createVector(0,0,0), this.initialPos).normalize(), -bondDistance);
            this.donePos = this.finalPos.copy();
            this.bentPos = bentPos;
        }
    }

    show(bondingProgress, state, spinAngle) {
        push();
        fill(255, 0, 0);
        let nucleusSize = (this.label === "H") ? 20 : 30;
        sphere(nucleusSize);

        push();
        fill(255, 255, 0);
        textSize(16);
        let offsetX = (this.label === "H") ? 0 : 0;
        translate(offsetX, 0, nucleusSize + 1);
        text("+" + this.protons, 0, 0);
        pop();
        pop();
        
        if (!showSpheres) {
            for (let i = 0; i < this.shells.length; i++) {
                if (!(this.label === "O" && i === this.shells.length - 1 && showClouds)) {
                    noFill();
                    stroke(255);
                    strokeWeight(1);
                    let radius = this.shellRadii[i];
                    push();
                    drawSmoothCircle(radius);
                    pop();
                }
            }
            noStroke();

            const electronSize = 6;
            
            if (state === "bonding" || state === "done") {
                if(this.label === "O") {
                    // Vẽ lớp electron trong
                    let innerShell = this.shells[0];
                    for (let j = 0; j < innerShell.length; j++) {
                        let e = innerShell[j];
                        let angle = (TWO_PI / innerShell.length) * j + spinAngle;
                        let ex = cos(angle) * this.shellRadii[0];
                        let ey = sin(angle) * this.shellRadii[0];
                        push();
                        translate(ex, ey, 0);
                        fill(e.col);
                        sphere(electronSize);
                        
                        // Vẽ nhãn "-" cho electron
                        if (showLabels) {
                            push();
                            translate(0, 0, electronSize + 2);
                            fill(255, 255, 0);
                            textSize(12);
                            text("-", 0, 0);
                            pop();
                        }
                        pop();
                    }
                }
                
                // Vẽ electron không liên kết của O
                if (this.label === "O" && !showClouds) {
                    let nonSharedElectrons = this.shells.at(-1).filter(el => !el.isShared);
                    if (nonSharedElectrons.length > 0) {
                        const nonBondingPairAngles = [
                            radians(270) - radians(10), radians(270) + radians(10),
                            radians(90) - radians(10), radians(90) + radians(10)
                        ];
                        
                        for(let j = 0; j < nonSharedElectrons.length; j++){
                            let e = nonSharedElectrons[j];
                            let finalAngle = nonBondingPairAngles[j];
                            let ex = cos(finalAngle) * this.shellRadii.at(-1);
                            let ey = sin(finalAngle) * this.shellRadii.at(-1);
                            push();
                            translate(ex, ey, 0);
                            fill(e.col);
                            sphere(electronSize);
                            
                            // Vẽ nhãn "-" cho electron
                            if (showLabels) {
                                push();
                                translate(0, 0, electronSize + 2);
                                fill(255, 255, 0);
                                textSize(12);
                                text("-", 0, 0);
                                pop();
                            }
                            pop();
                        }
                    }
                }
            } else {
                // Vẽ tất cả electron ở trạng thái ban đầu
                for (let i = 0; i < this.shells.length; i++) {
                    let radius = this.shellRadii[i];
                    for (let j = 0; j < this.shells[i].length; j++) {
                        let e = this.shells[i][j];
                        let angle = (TWO_PI / this.shells[i].length) * j + spinAngle;
                        let ex = cos(angle) * radius;
                        let ey = sin(angle) * radius;
                        
                        e.initialPos = createVector(this.pos.x + ex, this.pos.y + ey, 0);
                        
                        push();
                        translate(ex, ey, 0);
                        fill(e.col);
                        sphere(electronSize);
                        
                        // Vẽ nhãn "-" cho electron
                        if (showLabels) {
                            push();
                            translate(0, 0, electronSize + 2);
                            fill(255, 255, 0);
                            textSize(12);
                            text("-", 0, 0);
                            pop();
                        }
                        pop();
                    }
                }
            }
        }
    }
}

function drawSmoothCircle(radius) {
    let numPoints = 200;
    beginShape();
    for (let i = 0; i < numPoints; i++) {
        let angle = map(i, 0, numPoints, 0, TWO_PI);
        let x = radius * cos(angle);
        let y = radius * sin(angle);
        vertex(x, y);
    }
    endShape(CLOSE);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    perspective(PI / 3, windowWidth / windowHeight, 0.1, 4000);
    positionButtons();
}