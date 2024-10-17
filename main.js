import p5 from 'p5';
import {Pane} from 'tweakpane';

// next: frames tab? change frame width/height and layer, save as gif/mp4

const pane = new Pane({
  title: 'Parâmetros'
});
const PARAMS = {
  bg: {r: 22, g: 49, b: 58},
  viewGrid: true,
  gridSize: 50,
  gridColor: {r: 0, g: 0, b: 0},
  circleOpacity: 255,
  squareOpacity: 255,
  editing: false,
  frames: []
};
var anim = { x: 0, y: 0, w: 50, h: 50, color: 0, active: false, step: 0, speed: 50, loop: false, finished: false, quality: 10 };

pane.addBinding(PARAMS, 'bg', { label: "Cor Fundo", min: 0, max: 255 });

const malha = pane.addFolder({ title: "Malha" });
malha.addBinding(PARAMS, 'gridColor', { label: "Cor" });
malha.addBinding(PARAMS, 'gridSize', { label: "Tamanho", min: 20, max: 100, step: 10 });
malha.addBinding(PARAMS, 'circleOpacity', { label: "Opacidade Círculo", min: 0, max: 255, step: 1 });
malha.addBinding(PARAMS, 'squareOpacity', { label: "Opacidade Quadrado", min: 0, max: 255, step: 1 });
malha.addBinding(PARAMS, 'viewGrid', { label: "Visível" }).on('change', () => {
  anim.finished = false;
  anim.step = 0;
});

pane.addButton({ title: 'Nova Animação' }).on('click', () => {
  anim.active = false;
  PARAMS.frames = [];
  PARAMS.editing = true;
});

const frames = pane.addFolder({ title: "Animação" });

const vel = pane.addBinding(anim, 'speed', { label: "Velocidade", min: 0, max: 100, step: 1 });
const steps = pane.addBinding(anim, 'quality', { label: "Etapas", min: 1, max: 20, step: 1 });
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

var saving = false;
var saveInfo = { margin: true, transparent: true, quality: 1 };
const saveButtons = pane.addFolder({ title: "Salvar", hidden: true });
saveButtons.addBinding(saveInfo, "margin", { label: "Margem" });
saveButtons.addBinding(saveInfo, "transparent", { label: "Transparente" });
saveButtons.addBinding(saveInfo, "quality", { label: "Resolução", min: 1, max: 10, step: 1 });
saveButtons.addButton({ title: 'Salvar como PNG' }).on('click', () => {
  saving = true;
  anim.finished = false;
  anim.step = 0;
});

new p5((p) => {
  var cores = ["#16313a", "#455f6c", "#01ed07", "#ff9501"];
  var novaForma = {};
  var ctrl = false;
  var hoveringX = false;
  var hoveringEdit = false;
  var dragging = false;
  var draginfo = {};
  var clickOnX = false;
  var img; // img to be saved later

    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight);
      img = p.createGraphics(p.width, p.height);
    };
    p.draw = () => {
      let bgColor = PARAMS.bg;

      if(saving) {
        let saveSize = PARAMS.gridSize * saveInfo.quality;

        if(anim.step == 0) {
          img.clear();
          img = p.createGraphics(p.width*saveInfo.quality, p.height*saveInfo.quality);
          if(!saveInfo.transparent) {
            img.background(bgColor.r, bgColor.g, bgColor.b);
          }
        }

        // um.... sadly i wasn't able to just use p.animate() here because i needed to draw the rects on img instead of the normal canvas... i tried to add the canvas as a function argument and it didnt work. also the size of the rects are different according to saveinfo.quality
        // tldr: sadly a big code, but it works!
        if(anim.step < PARAMS.frames.length-1) {
          let previous = { color: {} };
          let previousStep = p.nf(anim.step%1, 1, 2) - p.nf(anim.speed/1000, 1, 2);

          if(previousStep >= 0) {
            previous.x = p.lerp(PARAMS.frames[p.int(anim.step)].x, PARAMS.frames[p.int(anim.step)+1].x, previousStep);
            previous.y = p.lerp(PARAMS.frames[p.int(anim.step)].y, PARAMS.frames[p.int(anim.step)+1].y, previousStep);
            previous.w = p.lerp(PARAMS.frames[p.int(anim.step)].w, PARAMS.frames[p.int(anim.step)+1].w, previousStep);
            previous.h = p.lerp(PARAMS.frames[p.int(anim.step)].h, PARAMS.frames[p.int(anim.step)+1].h, previousStep);
            previous.color.r = p.lerp(PARAMS.frames[p.int(anim.step)].color.r, PARAMS.frames[p.int(anim.step)+1].color.r, previousStep);
            previous.color.g = p.lerp(PARAMS.frames[p.int(anim.step)].color.g, PARAMS.frames[p.int(anim.step)+1].color.g, previousStep);
            previous.color.b = p.lerp(PARAMS.frames[p.int(anim.step)].color.b, PARAMS.frames[p.int(anim.step)+1].color.b, previousStep);
            previous.color.a = p.lerp(PARAMS.frames[p.int(anim.step)].color.a, PARAMS.frames[p.int(anim.step)+1].color.a, previousStep);
            
            anim.x = p.lerp(PARAMS.frames[p.int(anim.step)].x, PARAMS.frames[p.int(anim.step)+1].x, anim.step%1);
            anim.y = p.lerp(PARAMS.frames[p.int(anim.step)].y, PARAMS.frames[p.int(anim.step)+1].y, anim.step%1);
            anim.w = p.lerp(PARAMS.frames[p.int(anim.step)].w, PARAMS.frames[p.int(anim.step)+1].w, anim.step%1);
            anim.h = p.lerp(PARAMS.frames[p.int(anim.step)].h, PARAMS.frames[p.int(anim.step)+1].h, anim.step%1);
            anim.color.r = p.lerp(PARAMS.frames[p.int(anim.step)].color.r, PARAMS.frames[p.int(anim.step)+1].color.r, anim.step%1);
            anim.color.g = p.lerp(PARAMS.frames[p.int(anim.step)].color.g, PARAMS.frames[p.int(anim.step)+1].color.g, anim.step%1);
            anim.color.b = p.lerp(PARAMS.frames[p.int(anim.step)].color.b, PARAMS.frames[p.int(anim.step)+1].color.b, anim.step%1);
            anim.color.a = p.lerp(PARAMS.frames[p.int(anim.step)].color.a, PARAMS.frames[p.int(anim.step)+1].color.a, anim.step%1);
          } else if(anim.step > 1) {
            previousStep = previousStep + 1;
            previous.x = p.lerp(PARAMS.frames[p.int(anim.step)-1].x, PARAMS.frames[p.int(anim.step)].x, previousStep);
            previous.y = p.lerp(PARAMS.frames[p.int(anim.step)-1].y, PARAMS.frames[p.int(anim.step)].y, previousStep);
            previous.w = p.lerp(PARAMS.frames[p.int(anim.step)-1].w, PARAMS.frames[p.int(anim.step)].w, previousStep);
            previous.h = p.lerp(PARAMS.frames[p.int(anim.step)-1].h, PARAMS.frames[p.int(anim.step)].h, previousStep);
            previous.color.r = p.lerp(PARAMS.frames[p.int(anim.step)-1].color.r, PARAMS.frames[p.int(anim.step)].color.r, previousStep);
            previous.color.g = p.lerp(PARAMS.frames[p.int(anim.step)-1].color.g, PARAMS.frames[p.int(anim.step)].color.g, previousStep);
            previous.color.b = p.lerp(PARAMS.frames[p.int(anim.step)-1].color.b, PARAMS.frames[p.int(anim.step)].color.b, previousStep);
            previous.color.a = p.lerp(PARAMS.frames[p.int(anim.step)-1].color.a, PARAMS.frames[p.int(anim.step)].color.a, previousStep);
            
            anim.x = PARAMS.frames[p.int(anim.step)].x;
            anim.y = PARAMS.frames[p.int(anim.step)].y;
            anim.w = PARAMS.frames[p.int(anim.step)].w;
            anim.h = PARAMS.frames[p.int(anim.step)].h;
            anim.color.r = PARAMS.frames[p.int(anim.step)].color.r;
            anim.color.g = PARAMS.frames[p.int(anim.step)].color.g;
            anim.color.b = PARAMS.frames[p.int(anim.step)].color.b;
            anim.color.a = PARAMS.frames[p.int(anim.step)].color.a;
          }

          for(let s = 0; s < anim.quality; s++) {
            let etapa = { color: {} };
            etapa.x = p.lerp(previous.x, anim.x, s*1/anim.quality);
            etapa.y = p.lerp(previous.y, anim.y, s*1/anim.quality);
            etapa.w = p.lerp(previous.w, anim.w, s*1/anim.quality);
            etapa.h = p.lerp(previous.h, anim.h, s*1/anim.quality);
            etapa.color.r = p.lerp(previous.color.r, anim.color.r, s*1/anim.quality);
            etapa.color.g = p.lerp(previous.color.g, anim.color.g, s*1/anim.quality);
            etapa.color.b = p.lerp(previous.color.b, anim.color.b, s*1/anim.quality);
            etapa.color.a = p.lerp(previous.color.a, anim.color.a, s*1/anim.quality);
            img.fill(etapa.color.r, etapa.color.g, etapa.color.b, etapa.color.a*255);
            img.noStroke();
            img.rect(etapa.x*saveSize, etapa.y*saveSize, etapa.w*saveSize, etapa.h*saveSize, saveSize/2);
          }
        } else if(!anim.finished) {
          let previous = { color: {} };
          let previousStep = p.nf(anim.step%1, 1, 2) - p.nf(anim.speed/1000, 1, 2);
          previousStep += 1;
          previous.x = p.lerp(PARAMS.frames[p.int(anim.step)-1].x, PARAMS.frames[p.int(anim.step)].x, previousStep);
          previous.y = p.lerp(PARAMS.frames[p.int(anim.step)-1].y, PARAMS.frames[p.int(anim.step)].y, previousStep);
          previous.w = p.lerp(PARAMS.frames[p.int(anim.step)-1].w, PARAMS.frames[p.int(anim.step)].w, previousStep);
          previous.h = p.lerp(PARAMS.frames[p.int(anim.step)-1].h, PARAMS.frames[p.int(anim.step)].h, previousStep);
          previous.color.r = p.lerp(PARAMS.frames[p.int(anim.step)-1].color.r, PARAMS.frames[p.int(anim.step)].color.r, previousStep);
          previous.color.g = p.lerp(PARAMS.frames[p.int(anim.step)-1].color.g, PARAMS.frames[p.int(anim.step)].color.g, previousStep);
          previous.color.b = p.lerp(PARAMS.frames[p.int(anim.step)-1].color.b, PARAMS.frames[p.int(anim.step)].color.b, previousStep);
          previous.color.a = p.lerp(PARAMS.frames[p.int(anim.step)-1].color.a, PARAMS.frames[p.int(anim.step)].color.a, previousStep);
          
          anim.x = PARAMS.frames[PARAMS.frames.length-1].x;
          anim.y = PARAMS.frames[PARAMS.frames.length-1].y;
          anim.w = PARAMS.frames[PARAMS.frames.length-1].w;
          anim.h = PARAMS.frames[PARAMS.frames.length-1].h;
          anim.color.r = PARAMS.frames[PARAMS.frames.length-1].color.r;
          anim.color.g = PARAMS.frames[PARAMS.frames.length-1].color.g;
          anim.color.b = PARAMS.frames[PARAMS.frames.length-1].color.b;
          anim.color.a = PARAMS.frames[PARAMS.frames.length-1].color.a;
          for(let s = 0; s <= anim.quality; s++) {
            let etapa = { color: {} };
            etapa.x = p.lerp(previous.x, anim.x, s*1/anim.quality);
            etapa.y = p.lerp(previous.y, anim.y, s*1/anim.quality);
            etapa.w = p.lerp(previous.w, anim.w, s*1/anim.quality);
            etapa.h = p.lerp(previous.h, anim.h, s*1/anim.quality);
            etapa.color.r = p.lerp(previous.color.r, anim.color.r, s*1/anim.quality);
            etapa.color.g = p.lerp(previous.color.g, anim.color.g, s*1/anim.quality);
            etapa.color.b = p.lerp(previous.color.b, anim.color.b, s*1/anim.quality);
            etapa.color.a = p.lerp(previous.color.a, anim.color.a, s*1/anim.quality);
            img.fill(etapa.color.r, etapa.color.g, etapa.color.b, etapa.color.a*255);
            img.noStroke();
            img.rect(etapa.x*saveSize, etapa.y*saveSize, etapa.w*saveSize, etapa.h*saveSize, saveSize/2);
            if(s+1 > anim.quality) {
              img.fill(anim.color.r, anim.color.g, anim.color.b, anim.color.a*255);
              img.noStroke();
              img.rect(anim.x*saveSize, anim.y*saveSize, anim.w*saveSize, anim.h*saveSize, saveSize/2);
            }
          }
          anim.finished = true;
        }
        anim.step+=anim.speed/1000;

        if(anim.finished) {
          let cropSize = {x: -1, y: -1, bottom: 0, right: 0, w: 0, h: 0};
          for(let f = 0; f < PARAMS.frames.length; f++) {
            if(cropSize.x == -1 || PARAMS.frames[f].x < cropSize.x) cropSize.x = PARAMS.frames[f].x;
            if(cropSize.y == -1 || PARAMS.frames[f].y < cropSize.y) cropSize.y = PARAMS.frames[f].y;
            if(PARAMS.frames[f].x + PARAMS.frames[f].w > cropSize.right) cropSize.right = PARAMS.frames[f].x + PARAMS.frames[f].w;
            if(PARAMS.frames[f].y + PARAMS.frames[f].h > cropSize.bottom) cropSize.bottom = PARAMS.frames[f].y + PARAMS.frames[f].h;
          }
          cropSize.w = cropSize.right - cropSize.x;
          cropSize.h = cropSize.bottom - cropSize.y;
          let crop = img.get(cropSize.x*saveSize, cropSize.y*saveSize, cropSize.w*saveSize, cropSize.h*saveSize);
          
          if(saveInfo.margin) {
            let withMargin = p.createGraphics((cropSize.w+2)*saveSize, (cropSize.h+2)*saveSize);
            if(!saveInfo.transparent) withMargin.background(bgColor.r, bgColor.g, bgColor.b);
            withMargin.image(crop, saveSize, saveSize);
            crop = withMargin.get();
          }
          
          p.save(crop, "partnership.png");

          saving = false;
          anim.finished = false;
          anim.step = 0;
        }
      }

      if(PARAMS.frames.length > 0) frames.hidden = false; else frames.hidden = true;
      if(PARAMS.frames.length > 1) vel.hidden = false; else vel.hidden = true;
      if(PARAMS.frames.length > 1) steps.hidden = false; else steps.hidden = true;
      if(PARAMS.frames.length > 1) loop.hidden = false; else loop.hidden = true;
      if(PARAMS.frames.length > 1) play.hidden = false; else play.hidden = true;
      if(PARAMS.frames.length > 1 && anim.active) stop.hidden = false; else stop.hidden = true;
      if(PARAMS.frames.length > 1 && anim.active && !anim.loop) saveButtons.hidden = false; else saveButtons.hidden = true;

      if(anim.active && !saving) {
        if(anim.step == 0) {
          p.background(bgColor.r, bgColor.g, bgColor.b);
          if(PARAMS.viewGrid) {
            grid(p.width/PARAMS.gridSize, p.height/PARAMS.gridSize, (i, j) => {
              let s = PARAMS.gridSize;
              p.noFill();
              p.strokeWeight(1);
              p.stroke(PARAMS.gridColor.r, PARAMS.gridColor.g, PARAMS.gridColor.b, PARAMS.squareOpacity);
              p.square(i*s, j*s, s);
              p.stroke(PARAMS.gridColor.r, PARAMS.gridColor.g, PARAMS.gridColor.b, PARAMS.circleOpacity); p.ellipseMode(p.CORNER);
              p.circle(i*s, j*s, s);
            });
          }
        }
        
        p.animate(); // check function below (after draw, line 359 for now)

      } else {
        p.background(bgColor.r, bgColor.g, bgColor.b);

        if(dragging) {
          PARAMS.frames[draginfo.i].x = p.int(p.mouseX/PARAMS.gridSize) - PARAMS.frames[draginfo.i].w + 1;
          PARAMS.frames[draginfo.i].y = p.int(p.mouseY/PARAMS.gridSize);
        }

        PARAMS.frames.forEach((frame, i) => {
          //p.stroke(0); p.strokeWeight(3);
          p.noStroke();
          p.fill(frame.color.r, frame.color.g, frame.color.b, frame.color.a*255);
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
            p.stroke(PARAMS.gridColor.r, PARAMS.gridColor.g, PARAMS.gridColor.b, PARAMS.squareOpacity);
            p.square(i*s, j*s, s);

            p.stroke(PARAMS.gridColor.r, PARAMS.gridColor.g, PARAMS.gridColor.b, PARAMS.circleOpacity);
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

        // just the outline of the frames.. they need to be ABOVE the grid, or else it looks bad
        PARAMS.frames.forEach((frame, i) => {
          p.stroke(0); p.strokeWeight(3); p.noFill();
          p.rect(frame.x*PARAMS.gridSize, frame.y*PARAMS.gridSize, frame.w*PARAMS.gridSize, frame.h*PARAMS.gridSize, PARAMS.gridSize/2);
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

    p.animate = () => {
      if(anim.step < PARAMS.frames.length-1) {
        let previous = { color: {} };
        // if we don't work with nf here, the code bugs (numbers too close to zero result in e-16)
        let previousStep = p.nf(anim.step%1, 1, 2) - p.nf(anim.speed/1000, 1, 2);

        if(previousStep >= 0) {
          previous.x = p.lerp(PARAMS.frames[p.int(anim.step)].x, PARAMS.frames[p.int(anim.step)+1].x, previousStep);
          previous.y = p.lerp(PARAMS.frames[p.int(anim.step)].y, PARAMS.frames[p.int(anim.step)+1].y, previousStep);
          previous.w = p.lerp(PARAMS.frames[p.int(anim.step)].w, PARAMS.frames[p.int(anim.step)+1].w, previousStep);
          previous.h = p.lerp(PARAMS.frames[p.int(anim.step)].h, PARAMS.frames[p.int(anim.step)+1].h, previousStep);
          previous.color.r = p.lerp(PARAMS.frames[p.int(anim.step)].color.r, PARAMS.frames[p.int(anim.step)+1].color.r, previousStep);
          previous.color.g = p.lerp(PARAMS.frames[p.int(anim.step)].color.g, PARAMS.frames[p.int(anim.step)+1].color.g, previousStep);
          previous.color.b = p.lerp(PARAMS.frames[p.int(anim.step)].color.b, PARAMS.frames[p.int(anim.step)+1].color.b, previousStep);
          previous.color.a = p.lerp(PARAMS.frames[p.int(anim.step)].color.a, PARAMS.frames[p.int(anim.step)+1].color.a, previousStep);
          
          anim.x = p.lerp(PARAMS.frames[p.int(anim.step)].x, PARAMS.frames[p.int(anim.step)+1].x, anim.step%1);
          anim.y = p.lerp(PARAMS.frames[p.int(anim.step)].y, PARAMS.frames[p.int(anim.step)+1].y, anim.step%1);
          anim.w = p.lerp(PARAMS.frames[p.int(anim.step)].w, PARAMS.frames[p.int(anim.step)+1].w, anim.step%1);
          anim.h = p.lerp(PARAMS.frames[p.int(anim.step)].h, PARAMS.frames[p.int(anim.step)+1].h, anim.step%1);
          anim.color.r = p.lerp(PARAMS.frames[p.int(anim.step)].color.r, PARAMS.frames[p.int(anim.step)+1].color.r, anim.step%1);
          anim.color.g = p.lerp(PARAMS.frames[p.int(anim.step)].color.g, PARAMS.frames[p.int(anim.step)+1].color.g, anim.step%1);
          anim.color.b = p.lerp(PARAMS.frames[p.int(anim.step)].color.b, PARAMS.frames[p.int(anim.step)+1].color.b, anim.step%1);
          anim.color.a = p.lerp(PARAMS.frames[p.int(anim.step)].color.a, PARAMS.frames[p.int(anim.step)+1].color.a, anim.step%1);
        } else if(anim.step > 1) {
          previousStep = previousStep + 1;
          previous.x = p.lerp(PARAMS.frames[p.int(anim.step)-1].x, PARAMS.frames[p.int(anim.step)].x, previousStep);
          previous.y = p.lerp(PARAMS.frames[p.int(anim.step)-1].y, PARAMS.frames[p.int(anim.step)].y, previousStep);
          previous.w = p.lerp(PARAMS.frames[p.int(anim.step)-1].w, PARAMS.frames[p.int(anim.step)].w, previousStep);
          previous.h = p.lerp(PARAMS.frames[p.int(anim.step)-1].h, PARAMS.frames[p.int(anim.step)].h, previousStep);
          previous.color.r = p.lerp(PARAMS.frames[p.int(anim.step)-1].color.r, PARAMS.frames[p.int(anim.step)].color.r, previousStep);
          previous.color.g = p.lerp(PARAMS.frames[p.int(anim.step)-1].color.g, PARAMS.frames[p.int(anim.step)].color.g, previousStep);
          previous.color.b = p.lerp(PARAMS.frames[p.int(anim.step)-1].color.b, PARAMS.frames[p.int(anim.step)].color.b, previousStep);
          previous.color.a = p.lerp(PARAMS.frames[p.int(anim.step)-1].color.a, PARAMS.frames[p.int(anim.step)].color.a, previousStep);
          
          anim.x = PARAMS.frames[p.int(anim.step)].x;
          anim.y = PARAMS.frames[p.int(anim.step)].y;
          anim.w = PARAMS.frames[p.int(anim.step)].w;
          anim.h = PARAMS.frames[p.int(anim.step)].h;
          anim.color.r = PARAMS.frames[p.int(anim.step)].color.r;
          anim.color.g = PARAMS.frames[p.int(anim.step)].color.g;
          anim.color.b = PARAMS.frames[p.int(anim.step)].color.b;
          anim.color.a = PARAMS.frames[p.int(anim.step)].color.a;
        }

        for(let s = 0; s < anim.quality; s++) {
          let etapa = { color: {} };
          etapa.x = p.lerp(previous.x, anim.x, s*1/anim.quality);
          etapa.y = p.lerp(previous.y, anim.y, s*1/anim.quality);
          etapa.w = p.lerp(previous.w, anim.w, s*1/anim.quality);
          etapa.h = p.lerp(previous.h, anim.h, s*1/anim.quality);
          etapa.color.r = p.lerp(previous.color.r, anim.color.r, s*1/anim.quality);
          etapa.color.g = p.lerp(previous.color.g, anim.color.g, s*1/anim.quality);
          etapa.color.b = p.lerp(previous.color.b, anim.color.b, s*1/anim.quality);
          etapa.color.a = p.lerp(previous.color.a, anim.color.a, s*1/anim.quality);
          p.fill(etapa.color.r, etapa.color.g, etapa.color.b, etapa.color.a*255);
          p.noStroke();
          p.rect(etapa.x*PARAMS.gridSize, etapa.y*PARAMS.gridSize, etapa.w*PARAMS.gridSize, etapa.h*PARAMS.gridSize, PARAMS.gridSize/2);
        }
      } else if(!anim.finished) {
        let previous = { color: {} };
        let previousStep = p.nf(anim.step%1, 1, 2) - p.nf(anim.speed/1000, 1, 2);
        previousStep += 1;
        previous.x = p.lerp(PARAMS.frames[p.int(anim.step)-1].x, PARAMS.frames[p.int(anim.step)].x, previousStep);
        previous.y = p.lerp(PARAMS.frames[p.int(anim.step)-1].y, PARAMS.frames[p.int(anim.step)].y, previousStep);
        previous.w = p.lerp(PARAMS.frames[p.int(anim.step)-1].w, PARAMS.frames[p.int(anim.step)].w, previousStep);
        previous.h = p.lerp(PARAMS.frames[p.int(anim.step)-1].h, PARAMS.frames[p.int(anim.step)].h, previousStep);
        previous.color.r = p.lerp(PARAMS.frames[p.int(anim.step)-1].color.r, PARAMS.frames[p.int(anim.step)].color.r, previousStep);
        previous.color.g = p.lerp(PARAMS.frames[p.int(anim.step)-1].color.g, PARAMS.frames[p.int(anim.step)].color.g, previousStep);
        previous.color.b = p.lerp(PARAMS.frames[p.int(anim.step)-1].color.b, PARAMS.frames[p.int(anim.step)].color.b, previousStep);
        previous.color.a = p.lerp(PARAMS.frames[p.int(anim.step)-1].color.a, PARAMS.frames[p.int(anim.step)].color.a, previousStep);
        
        anim.x = PARAMS.frames[PARAMS.frames.length-1].x;
        anim.y = PARAMS.frames[PARAMS.frames.length-1].y;
        anim.w = PARAMS.frames[PARAMS.frames.length-1].w;
        anim.h = PARAMS.frames[PARAMS.frames.length-1].h;
        anim.color.r = PARAMS.frames[PARAMS.frames.length-1].color.r;
        anim.color.g = PARAMS.frames[PARAMS.frames.length-1].color.g;
        anim.color.b = PARAMS.frames[PARAMS.frames.length-1].color.b;
        anim.color.a = PARAMS.frames[PARAMS.frames.length-1].color.a;
        for(let s = 0; s <= anim.quality; s++) {
          let etapa = { color: {} };
          etapa.x = p.lerp(previous.x, anim.x, s*1/anim.quality);
          etapa.y = p.lerp(previous.y, anim.y, s*1/anim.quality);
          etapa.w = p.lerp(previous.w, anim.w, s*1/anim.quality);
          etapa.h = p.lerp(previous.h, anim.h, s*1/anim.quality);
          etapa.color.r = p.lerp(previous.color.r, anim.color.r, s*1/anim.quality);
          etapa.color.g = p.lerp(previous.color.g, anim.color.g, s*1/anim.quality);
          etapa.color.b = p.lerp(previous.color.b, anim.color.b, s*1/anim.quality);
          etapa.color.a = p.lerp(previous.color.a, anim.color.a, s*1/anim.quality);
          p.fill(etapa.color.r, etapa.color.g, etapa.color.b, etapa.color.a*255);
          p.noStroke();
          p.rect(etapa.x*PARAMS.gridSize, etapa.y*PARAMS.gridSize, etapa.w*PARAMS.gridSize, etapa.h*PARAMS.gridSize, PARAMS.gridSize/2);
          // this if makes sure the very LAST frame is drawn
          if(s+1 > anim.quality) {
            p.fill(anim.color.r, anim.color.g, anim.color.b, anim.color.a*255);
            p.noStroke();
            p.rect(anim.x*PARAMS.gridSize, anim.y*PARAMS.gridSize, anim.w*PARAMS.gridSize, anim.h*PARAMS.gridSize, PARAMS.gridSize/2);
          }
        }
        anim.finished = true;
      }
      
      anim.step+=anim.speed/1000;
      if(anim.loop && anim.step > PARAMS.frames.length) {
        anim.step = 0;
        anim.finished = false;
      }
    }

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