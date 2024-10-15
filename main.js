import p5 from 'p5';
import {Pane} from 'tweakpane';

const pane = new Pane({
  title: 'Parâmetros'
});
const PARAMS = {
  bg: 200,
  viewGrid: true,
  gridSize: 50,
  circleOpacity: 255,
  squareOpacity: 255,
  editing: false,
  frames: []
};
var anim = { x: 0, y: 0, w: 50, h: 50, color: 0, active: false, step: 0, speed: 50, loop: true, finished: false };

pane.addBinding(PARAMS, 'bg', { label: "Cor Fundo", min: 0, max: 255 });

const malha = pane.addFolder({ title: "Malha" });
malha.addBinding(PARAMS, 'gridSize', { label: "Tamanho", min: 20, max: 100, step: 10 });
malha.addBinding(PARAMS, 'circleOpacity', { label: "Opacidade Círculo", min: 0, max: 255, step: 1 });
malha.addBinding(PARAMS, 'squareOpacity', { label: "Opacidade Quadrado", min: 0, max: 255, step: 1 });
malha.addBinding(PARAMS, 'viewGrid', { label: "Visível" });


pane.addButton({ title: 'Nova Animação' }).on('click', () => {
  anim.active = false;
  PARAMS.frames = [];
  PARAMS.editing = true;
});

const frames = pane.addFolder({ title: "Animação" });

const vel = pane.addBinding(anim, 'speed', { label: "Velocidade", min: 0, max: 100, step: 1 });
const loop = pane.addBinding(anim, 'loop', { label: "Loop" });
const play = pane.addButton({ title: 'Rodar Animação', hidden: true }).on('click', () => {
  anim.x = PARAMS.frames[0].x;
  anim.y = PARAMS.frames[0].y;
  anim.w = PARAMS.frames[0].w;
  anim.h = PARAMS.frames[0].h;
  anim.color = { r: PARAMS.frames[0].color.r, g: PARAMS.frames[0].color.g, b: PARAMS.frames[0].color.b, a: PARAMS.frames[0].color.a };
  anim.active = true;
  anim.step = 0;
  anim.finished = false;
});
const stop = pane.addButton({ title: 'Parar Animação', hidden: true }).on('click', () => {
  anim.active = false;
});

new p5((p) => {
  var cores = ["#101012", "#00ff08", "#ff8400", "#73737d"];
  var novaForma = {};
  var ctrl = false;
  var hoveringX = false;
  var hoveringEdit = false;
  var dragging = false;
  var draginfo = {};
  var clickOnX = false;

    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight);
    };
    p.draw = () => {
      if(PARAMS.frames.length > 0) frames.hidden = false; else frames.hidden = true;
      if(PARAMS.frames.length > 1) vel.hidden = false; else vel.hidden = true;
      if(PARAMS.frames.length > 1) loop.hidden = false; else loop.hidden = true;
      if(PARAMS.frames.length > 1) play.hidden = false; else play.hidden = true;
      if(PARAMS.frames.length > 1 && anim.active) stop.hidden = false; else stop.hidden = true;

      let bgColor = PARAMS.bg;
      if(anim.active) {
        if(anim.step == 0) {
          p.background(bgColor);
          if(PARAMS.viewGrid) {
            grid(p.width/PARAMS.gridSize, p.height/PARAMS.gridSize, (i, j) => {
              let s = PARAMS.gridSize;
              p.noFill();
              p.strokeWeight(1); p.stroke(0, PARAMS.squareOpacity);
              p.square(i*s, j*s, s);
              p.stroke(0, PARAMS.circleOpacity); p.ellipseMode(p.CORNER);
              p.circle(i*s, j*s, s);
            });
          }
        }
        if(anim.step < PARAMS.frames.length-1) {
          anim.x = p.lerp(PARAMS.frames[p.int(anim.step)].x, PARAMS.frames[p.int(anim.step)+1].x, anim.step%1);
          anim.y = p.lerp(PARAMS.frames[p.int(anim.step)].y, PARAMS.frames[p.int(anim.step)+1].y, anim.step%1);
          anim.w = p.lerp(PARAMS.frames[p.int(anim.step)].w, PARAMS.frames[p.int(anim.step)+1].w, anim.step%1);
          anim.h = p.lerp(PARAMS.frames[p.int(anim.step)].h, PARAMS.frames[p.int(anim.step)+1].h, anim.step%1);
          anim.color.r = p.lerp(PARAMS.frames[p.int(anim.step)].color.r, PARAMS.frames[p.int(anim.step)+1].color.r, anim.step%1);
          anim.color.g = p.lerp(PARAMS.frames[p.int(anim.step)].color.g, PARAMS.frames[p.int(anim.step)+1].color.g, anim.step%1);
          anim.color.b = p.lerp(PARAMS.frames[p.int(anim.step)].color.b, PARAMS.frames[p.int(anim.step)+1].color.b, anim.step%1);
          anim.color.a = p.lerp(PARAMS.frames[p.int(anim.step)].color.a, PARAMS.frames[p.int(anim.step)+1].color.a, anim.step%1);
          p.fill(anim.color.r, anim.color.g, anim.color.b, anim.color.a*255);
          p.noStroke();
          p.rect(anim.x*PARAMS.gridSize, anim.y*PARAMS.gridSize, anim.w*PARAMS.gridSize, anim.h*PARAMS.gridSize, PARAMS.gridSize/2);
        } else if(!anim.finished) {
          anim.x = PARAMS.frames[PARAMS.frames.length-1].x;
          anim.y = PARAMS.frames[PARAMS.frames.length-1].y;
          anim.w = PARAMS.frames[PARAMS.frames.length-1].w;
          anim.h = PARAMS.frames[PARAMS.frames.length-1].h;
          anim.color.r = PARAMS.frames[PARAMS.frames.length-1].color.r;
          anim.color.g = PARAMS.frames[PARAMS.frames.length-1].color.g;
          anim.color.b = PARAMS.frames[PARAMS.frames.length-1].color.b;
          anim.color.a = PARAMS.frames[PARAMS.frames.length-1].color.a;
          p.fill(anim.color.r, anim.color.g, anim.color.b, anim.color.a*255);
          p.noStroke();
          p.rect(anim.x*PARAMS.gridSize, anim.y*PARAMS.gridSize, anim.w*PARAMS.gridSize, anim.h*PARAMS.gridSize, PARAMS.gridSize/2);
          anim.finished = true;
        }
        anim.step+=anim.speed/1000;
        if(anim.loop && anim.step > PARAMS.frames.length) {
          anim.step = 0;
          anim.finished = false;
        }
      } else {
        p.background(bgColor);

        if(dragging) {
          PARAMS.frames[draginfo.i].x = p.int(p.mouseX/PARAMS.gridSize) - PARAMS.frames[draginfo.i].w + 1;
          PARAMS.frames[draginfo.i].y = p.int(p.mouseY/PARAMS.gridSize);
        }

        PARAMS.frames.forEach((frame, i) => {
          p.noStroke(); p.fill(frame.color.r, frame.color.g, frame.color.b, frame.color.a*255);
          p.rect(frame.x*PARAMS.gridSize, frame.y*PARAMS.gridSize, frame.w*PARAMS.gridSize, frame.h*PARAMS.gridSize, PARAMS.gridSize/2);
        });

        if(p.mouseIsPressed && !anim.active && novaForma.startX != undefined && novaForma.startY != undefined) {
          novaForma.endX = p.int(p.mouseX / PARAMS.gridSize);
          novaForma.endY = p.int(p.mouseY / PARAMS.gridSize);

          let frame = {
            x: p.min(novaForma.startX, novaForma.endX),
            y: p.min(novaForma.startY, novaForma.endY),
            w: p.abs(novaForma.endX - novaForma.startX) + 1,
            h: p.abs(novaForma.endY - novaForma.startY) + 1
          };
          p.fill(255, 255, 255, 100);
          p.stroke(0);
          p.strokeWeight(4);
          p.rect(frame.x*PARAMS.gridSize, frame.y*PARAMS.gridSize, frame.w*PARAMS.gridSize, frame.h*PARAMS.gridSize, PARAMS.gridSize/2);
        } else novaForma = {};

        if(PARAMS.viewGrid) {
          grid(p.width/PARAMS.gridSize, p.height/PARAMS.gridSize, (i, j) => {
            let s = PARAMS.gridSize;
            p.noFill();

            p.strokeWeight(1);
            p.stroke(0, PARAMS.squareOpacity);
            p.square(i*s, j*s, s);

            p.stroke(0, PARAMS.circleOpacity);
            p.ellipseMode(p.CORNER);
            p.circle(i*s, j*s, s);
          });
        }

        hoveringEdit = false;
        PARAMS.frames.forEach((frame, i) => {
          if(p.mouseX > frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize-PARAMS.gridSize &&
              p.mouseY > frame.y*PARAMS.gridSize &&
              p.mouseX < frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize &&
              p.mouseY < frame.y*PARAMS.gridSize + PARAMS.gridSize/2) {
            hoveringEdit = true;
          }
        });
        
        if(!anim.active && !hoveringEdit && !dragging) {
          let selection = {
            x: p.int(p.mouseX / PARAMS.gridSize),
            y: p.int(p.mouseY / PARAMS.gridSize),
          };
          p.ellipseMode(p.CENTER);
          p.push();
            p.translate(selection.x*PARAMS.gridSize + PARAMS.gridSize/2, selection.y*PARAMS.gridSize + PARAMS.gridSize/2);
            p.rotate(p.frameCount/100);
            p.fill(0); p.circle(0, 0, PARAMS.gridSize);
            p.drawingContext.setLineDash([5, 10]);
            p.noFill(); p.stroke(255); p.strokeWeight(4);
            p.circle(0, 0, PARAMS.gridSize*0.8);
          p.pop();
          p.drawingContext.setLineDash([]);
        }

        // move and delete buttons (they need to be above everything)
        PARAMS.frames.forEach((frame, i) => {
          if(p.mouseX > frame.x*PARAMS.gridSize && p.mouseY > frame.y*PARAMS.gridSize &&
             p.mouseX < frame.x*PARAMS.gridSize + frame.w*PARAMS.gridSize &&
             p.mouseY < frame.y*PARAMS.gridSize + frame.h*PARAMS.gridSize) {
            p.fill(255); p.stroke(0); p.strokeWeight(2);

            // delete button
            p.rect(frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize-PARAMS.gridSize/2, frame.y*PARAMS.gridSize, PARAMS.gridSize/2);
            p.line(frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize-PARAMS.gridSize/2, frame.y*PARAMS.gridSize,
                   frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize, frame.y*PARAMS.gridSize+PARAMS.gridSize/2);
            p.line(frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize, frame.y*PARAMS.gridSize,
                   frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize-PARAMS.gridSize/2, frame.y*PARAMS.gridSize+PARAMS.gridSize/2);

            // move button
            p.rect(frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize-PARAMS.gridSize, frame.y*PARAMS.gridSize, PARAMS.gridSize/2);
            p.pointArrow(frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize-PARAMS.gridSize/2-PARAMS.gridSize/4-PARAMS.gridSize/4, frame.y*PARAMS.gridSize+PARAMS.gridSize/4, PARAMS.gridSize/4, PARAMS.gridSize/8, 0);
            p.pointArrow(frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize-PARAMS.gridSize/2-PARAMS.gridSize/4, frame.y*PARAMS.gridSize+PARAMS.gridSize/4-PARAMS.gridSize/4, PARAMS.gridSize/4, PARAMS.gridSize/8, p.PI/2);
            p.pointArrow(frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize-PARAMS.gridSize/2-PARAMS.gridSize/4+PARAMS.gridSize/4, frame.y*PARAMS.gridSize+PARAMS.gridSize/4, PARAMS.gridSize/4, PARAMS.gridSize/8, p.PI);
            p.pointArrow(frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize-PARAMS.gridSize/2-PARAMS.gridSize/4, frame.y*PARAMS.gridSize+PARAMS.gridSize/4+PARAMS.gridSize/4, PARAMS.gridSize/4, PARAMS.gridSize/8, p.PI*3/2);
          }
        });
      }
    };

    p.pointArrow = (x, y, len, s, dir) => {
      p.push();
        p.translate(x, y);
        p.rotate(dir);

        p.stroke(0); p.strokeWeight(1);
        p.line(0, 0, len, 0);
        
        p.fill(0); p.noStroke();
        p.triangle(0, 0, s, s, s, -s);
      p.pop();
    }

    p.keyPressed = () => {
      if(p.keyCode == p.CONTROL) { ctrl = true; }
      if(ctrl && !anim.active && (p.key == 'z' || p.key == 'Z')) {
        PARAMS.frames.pop();
        
        frames.children.forEach((oldBind) => { oldBind.dispose(); });
        PARAMS.frames.forEach((frame, i) => { frames.addBinding(frame, 'color', { label: "Frame "+(i+1) }); });
      }
    }
    p.keyReleased = () => { if(p.keyCode == p.CONTROL) { ctrl = false; } }

    p.mousePressed = () => {
      const paneBounds = pane.element.getBoundingClientRect();
      if (p.mouseX < paneBounds.left || p.mouseX > paneBounds.right || p.mouseY < paneBounds.top || p.mouseY > paneBounds.bottom) {
        if(!anim.active) {
          hoveringEdit = false;
          PARAMS.frames.forEach((frame, i) => {
            if(p.mouseX > frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize-PARAMS.gridSize &&
               p.mouseY > frame.y*PARAMS.gridSize &&
               p.mouseX < frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize &&
               p.mouseY < frame.y*PARAMS.gridSize + PARAMS.gridSize/2) {
              hoveringEdit = true;
            }
            if(p.mouseX > frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize-PARAMS.gridSize/2 &&
              p.mouseY > frame.y*PARAMS.gridSize &&
              p.mouseX < frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize &&
              p.mouseY < frame.y*PARAMS.gridSize + PARAMS.gridSize/2) {
             clickOnX = true;
           }
            if(p.mouseX > frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize-PARAMS.gridSize &&
              p.mouseY > frame.y*PARAMS.gridSize &&
              p.mouseX < frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize-PARAMS.gridSize/2 &&
              p.mouseY < frame.y*PARAMS.gridSize + PARAMS.gridSize/2) {
              dragging = true;
              draginfo = { x: frame.x, y: frame.y, i: i};
            }
          });
          if(!hoveringEdit) {
            novaForma.startX = p.int(p.mouseX / PARAMS.gridSize);
            novaForma.startY = p.int(p.mouseY / PARAMS.gridSize);
          }
        }
      }
    };
    p.mouseReleased = () => {
      dragging = false;
      hoveringX = false;
      hoveringEdit = false;
      const paneBounds = pane.element.getBoundingClientRect();
      if (p.mouseX < paneBounds.left || p.mouseX > paneBounds.right || p.mouseY < paneBounds.top || p.mouseY > paneBounds.bottom) {
        if(!anim.active) {
          let hoveringFrames = [];
          PARAMS.frames.forEach((frame, i) => {
            if(p.mouseX > frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize-PARAMS.gridSize/2 &&
               p.mouseY > frame.y*PARAMS.gridSize &&
               p.mouseX < frame.x*PARAMS.gridSize+frame.w*PARAMS.gridSize &&
               p.mouseY < frame.y*PARAMS.gridSize + PARAMS.gridSize/2) {
              hoveringX = true;
              hoveringFrames.push(i);
            }
          });
          
          if(novaForma.startX != undefined && novaForma.startY != undefined) {
            PARAMS.frames.push({
              x: p.min(novaForma.startX, novaForma.endX),
              y: p.min(novaForma.startY, novaForma.endY),
              w: p.abs(novaForma.endX - novaForma.startX) + 1,
              h: p.abs(novaForma.endY - novaForma.startY) + 1,
              color: {
                r: p.color(cores[PARAMS.frames.length%4]).levels[0],
                g: p.color(cores[PARAMS.frames.length%4]).levels[1],
                b: p.color(cores[PARAMS.frames.length%4]).levels[2],
                a: p.color(cores[PARAMS.frames.length%4]).levels[3]/255,
              }
            });
          } else if(hoveringX && clickOnX) PARAMS.frames.splice(p.max(hoveringFrames), 1);

          frames.children.forEach((oldBind) => { oldBind.dispose(); });
          PARAMS.frames.forEach((frame, i) => { frames.addBinding(frame, 'color', { label: "Frame "+(i+1) }); });
        }
      }
    };
    clickOnX = false;
});

function grid(rows, cols, fun) {
  for(let i = 0; i < rows; i++) {
    for(let j = 0; j < cols; j++) {
      fun(i, j);
    }
  }
}