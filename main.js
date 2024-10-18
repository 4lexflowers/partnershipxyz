import p5 from 'p5';
import { Pane } from 'tweakpane';
import { linear, easeInSine, easeOutSine, easeInOutSine, easeInQuad, easeOutQuad, easeInOutQuad, easeInCubic, easeOutCubic,
         easeInOutCubic, easeInQuart, easeOutQuart, easeInOutQuart, easeInQuint, easeOutQuint, easeInOutQuint, easeInExpo, easeOutExpo,
         easeInOutExpo, easeInCirc, easeOutCirc, easeInOutCirc, easeInBack, easeOutBack, easeInOutBack, easeInElastic, easeOutElastic,
         easeInOutElastic, easeOutBounce, easeInBounce, easeInOutBounce } from 'easing-utils';

// possible future todos, wait for instruction:
// - custom grid strokeWeight/espessura
// - change frame width/height and layer
// - responsive move/delete buttons (make them bigger if the shape is big enough and grid is small)
// - save as gif/mp4 (this is going to be hard, p5js doesn't allow transparent gifs, but we do have the saveGif function for gifs with background)
// - apply ease on save PNG? right now it saves all of them as linear. i think this is only useful on GIFs...
// - realign when grid resize? sounds like too much work
//
// done this commit:
// - apply ease on animation + select
// - export/import animation as JSON
// - restart animation on grid change
// - padronizar cores das formas, escolher 4 ou 6
// - optimize grid loading
// - custom border radius

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
  frames: [],
  borderRadius: 0.5
};
var anim = { x: 0, y: 0, w: 50, h: 50, color: 0, active: false, step: 0, speed: 50, loop: false, finished: false, quality: 10 };
const coresRGB = {
  cinzaEscuro: {r: 22, g: 49, b: 58, a: 1},
  cinzaAlto: {r: 69, g: 95, b: 108, a: 1},
  cinzaBaixo: {r: 116, g: 145, b: 161, a: 1},
  cinzaClaro: {r: 161, g: 194, b: 213, a: 1},
  verdeVibrante: {r: 1, g: 237, b: 7, a: 1},
  laranjaEnergetico: {r: 255, g: 149, b: 1, a: 1}
};

const pastaFundo = pane.addFolder({ title: "Fundo" });
// pane.addBinding(PARAMS, 'bg', { label: "Cor Fundo", min: 0, max: 255 });
var corFundo = pastaFundo.addBlade({ label: "Cor", view: 'list',
  options: [
    {text: 'Cinza Escuro', value: coresRGB.cinzaEscuro},
    {text: 'Cinza Claro', value: coresRGB.cinzaClaro},
    {text: 'Verde Vibrante', value: coresRGB.verdeVibrante},
    {text: 'Laranja Energético', value: coresRGB.laranjaEnergetico},
  ],
  value: coresRGB.cinzaEscuro
}).on('change', () => { anim.finished = false; anim.step = 0; anim.progress = 0; });

const paleta = pane.addBlade({ label: "Paleta", view: 'list',
  options: [
    {text: 'Quatro Cores', value: 4},
    {text: 'Seis Cores', value: 6},
    {text: 'Qualquer Cor!', value: 1}
  ],
  value: 4
}).on('change', () => {
  frames.children.forEach((oldBind) => { oldBind.dispose(); });
  let paletteOptions;
  switch(paleta.value) {
    default:
    case 4:
      paletteOptions = [
        {text: 'Laranja Energético', value: coresRGB.laranjaEnergetico},
        {text: 'Verde Vibrante', value: coresRGB.verdeVibrante},
        {text: 'Cinza Alto', value: coresRGB.cinzaAlto},
        {text: 'Cinza Escuro', value: coresRGB.cinzaEscuro}
      ]
      break;
    case 6:
      paletteOptions = [
        {text: 'Laranja Energético', value: coresRGB.laranjaEnergetico},
        {text: 'Verde Vibrante', value: coresRGB.verdeVibrante},
        {text: 'Cinza Claro', value: coresRGB.cinzaClaro},
        {text: 'Cinza Baixo', value: coresRGB.cinzaBaixo},
        {text: 'Cinza Alto', value: coresRGB.cinzaAlto},
        {text: 'Cinza Escuro', value: coresRGB.cinzaEscuro}
      ]
      break;
  }
  PARAMS.frames.forEach((frame, i) => {
    var corFrame;
    if(paleta.value == 1) {
      frame.color = { ...frame.color }; // cópia rasa pra não sobrepor o objeto coresRGB
      corFrame = frames.addBinding(frame, 'color', { label: "Forma "+(i+1) });
    } else {
      paletteOptions.forEach((option) => {
        if(frame.color.r == option.value.r && frame.color.g == option.value.g && frame.color.b == option.value.b && frame.color.a == option.value.a) {
          frame.color = option.value;
        }
      });
      corFrame = frames.addBlade({ label: "Forma "+(i+1), view: 'list',
        options: paletteOptions, // aqui daria pra acrescentar uma cor nao identificada, pra nao ficar vazio. não sei se funciona
        value: frame.color
      }).on('change', () => { frame.color = corFrame.value });
    }
    //frame.colorOptions = corFrame; // useless
  });
  if(paleta.value == 1) {
    PARAMS.bg = { r: corFundo.value.r, g: corFundo.value.g, b: corFundo.value.b, a: corFundo.value.a };
    corFundo.dispose();
    corFundo = pastaFundo.addBinding(PARAMS, 'bg', { label: "Cor" } ).on('change', () => { anim.finished = false; anim.step = 0; anim.progress = 0; });
  } else {
    if(corFundo.value) PARAMS.bg = corFundo.value;
    paletteOptions.forEach((option) => {
      if(PARAMS.bg.r == option.value.r && PARAMS.bg.g == option.value.g && PARAMS.bg.b == option.value.b && PARAMS.bg.a == option.value.a) {
        PARAMS.bg = option.value;
      }
    });
    corFundo.dispose();
    corFundo = pastaFundo.addBlade({ label: "Cor", view: 'list',
      options: paletteOptions,
      value: PARAMS.bg // antes era coresRGB.cinzaEscuro
    }).on('change', () => { anim.finished = false; anim.step = 0; anim.progress = 0; });
  }
});
pane.addBinding(PARAMS, 'borderRadius', { label: "Arredondamento", min: 0, max: 10, step: 0.5 }).on('change', () => { anim.finished = false; anim.step = 0; anim.progress = 0; });

var newGridSize = true;

const malha = pane.addFolder({ title: "Malha" });
// malha.addBinding(PARAMS, 'gridColor', { label: "Cor" });
const corGrid = malha.addBlade({ label: "Cor", view: 'list',
  options: [
    {text: 'Preto', value: 0},
    {text: 'Branco', value: 255}
  ],
  value: 0
}).on('change', () => { if(PARAMS.viewGrid && (PARAMS.circleOpacity > 0 || PARAMS.squareOpacity > 0)) { newGridSize = true; anim.finished = false; anim.step = 0; anim.progress = 0; } });
malha.addBinding(PARAMS, 'gridSize', { label: "Tamanho", min: 20, max: 100, step: 10 }).on('change', () => { newGridSize = true; anim.finished = false; anim.step = 0; anim.progress = 0; });
malha.addBinding(PARAMS, 'circleOpacity', { label: "Opacidade Círculo", min: 0, max: 255, step: 1 }).on('change', () => { if(PARAMS.viewGrid) { newGridSize = true; anim.finished = false; anim.step = 0; anim.progress = 0; } });
malha.addBinding(PARAMS, 'squareOpacity', { label: "Opacidade Quadrado", min: 0, max: 255, step: 1 }).on('change', () => { if(PARAMS.viewGrid) { newGridSize = true; anim.finished = false; anim.step = 0; anim.progress = 0; } });
malha.addBinding(PARAMS, 'viewGrid', { label: "Visível" }).on('change', () => { anim.finished = false; anim.step = 0; anim.progress = 0; });

pane.addButton({ title: 'Nova Animação' }).on('click', () => {
  anim.active = false;
  PARAMS.frames = [];
  PARAMS.editing = true;
});

var importingJSON = false;
pane.addButton({ title: 'Importar Animação (JSON)' }).on('click', () => {
  importingJSON = true;
});

const frames = pane.addFolder({ title: "Animação" }).on('change', () => { anim.finished = false; anim.step = 0; anim.progress = 0; });

const vel = pane.addBinding(anim, 'speed', { label: "Velocidade", min: 0, max: 100, step: 1 }).on('change', () => { anim.finished = false; anim.step = 0; anim.progress = 0; });
const steps = pane.addBinding(anim, 'quality', { label: "Etapas", min: 1, max: 50, step: 1 }).on('change', () => { anim.finished = false; anim.step = 0; anim.progress = 0; });

const easeType = pane.addBlade({
  view: 'list',
  label: 'Easing',
  options: [
    { text: 'linear', value: 'linear' },
    { text: 'easeInSine', value: 'easeInSine' },
    { text: 'easeOutSine', value: 'easeOutSine' },
    { text: 'easeInOutSine', value: 'easeInOutSine' },
    { text: 'easeInQuad', value: 'easeInQuad' },
    { text: 'easeOutQuad', value: 'easeOutQuad' },
    { text: 'easeInOutQuad', value: 'easeInOutQuad' },
    { text: 'easeInCubic', value: 'easeInCubic' },
    { text: 'easeOutCubic', value: 'easeOutCubic' },
    { text: 'easeInOutCubic', value: 'easeInOutCubic' },
    { text: 'easeInQuart', value: 'easeInQuart' },
    { text: 'easeOutQuart', value: 'easeOutQuart' },
    { text: 'easeInOutQuart', value: 'easeInOutQuart' },
    { text: 'easeInQuint', value: 'easeInQuint' },
    { text: 'easeOutQuint', value: 'easeOutQuint' },
    { text: 'easeInOutQuint', value: 'easeInOutQuint' },
    { text: 'easeInExpo', value: 'easeInExpo' },
    { text: 'easeOutExpo', value: 'easeOutExpo' },
    { text: 'easeInOutExpo', value: 'easeInOutExpo' },
    { text: 'easeInCirc', value: 'easeInCirc' },
    { text: 'easeOutCirc', value: 'easeOutCirc' },
    { text: 'easeInOutCirc', value: 'easeInOutCirc' },
    // the eases below do not match the project, as they will draw an ugly version
    // { text: 'easeInBack', value: 'easeInBack' },
    // { text: 'easeOutBack', value: 'easeOutBack' },
    // { text: 'easeInOutBack', value: 'easeInOutBack' },
    // { text: 'easeInElastic', value: 'easeInElastic' },
    // { text: 'easeOutElastic', value: 'easeOutElastic' },
    // { text: 'easeInOutElastic', value: 'easeInOutElastic' },
    // { text: 'easeOutBounce', value: 'easeOutBounce' },
    // { text: 'easeInBounce', value: 'easeInBounce' },
    // { text: 'easeInOutBounce', value: 'easeInOutBounce' }
  ],
  value: 'linear'
}).on('change', () => { anim.finished = false; anim.step = 0; anim.progress = 0; });

const loop = pane.addBinding(anim, 'loop', { label: "Loop" });
const play = pane.addButton({ title: 'Rodar Animação', hidden: true }).on('click', () => {
  anim.x = PARAMS.frames[0].x;
  anim.y = PARAMS.frames[0].y;
  anim.w = PARAMS.frames[0].w;
  anim.h = PARAMS.frames[0].h;
  anim.color = { r: PARAMS.frames[0].color.r, g: PARAMS.frames[0].color.g, b: PARAMS.frames[0].color.b, a: PARAMS.frames[0].color.a };
  anim.active = true;
  anim.step = 0;
  anim.easedStep = 0;
  anim.progress = 0;
  anim.finished = false;
});
const stop = pane.addButton({ title: 'Parar Animação', hidden: true }).on('click', () => {
  anim.active = false;
});

var saving = false;
var exportingJSON = false;
var saveInfo = { margin: true, transparent: true, quality: 1 };
const saveButtons = pane.addFolder({ title: "Salvar", hidden: true });

const saveTabs = saveButtons.addTab({
  pages: [
    {title: 'PNG'},
    {title: 'JSON'},
  ],
});

saveTabs.pages[0].addBinding(saveInfo, "margin", { label: "Margem" });
saveTabs.pages[0].addBinding(saveInfo, "transparent", { label: "Transparente" });
saveTabs.pages[0].addBinding(saveInfo, "quality", { label: "Resolução", min: 1, max: 10, step: 1 });
saveTabs.pages[0].addButton({ title: 'Salvar como PNG' }).on('click', () => {
  saving = true;
  anim.finished = false;
  anim.step = 0;
  anim.progress = 0;
});

saveTabs.pages[1].addButton({ title: 'Salvar como JSON' }).on('click', () => {
  console.log("Saving JSON...");
  exportingJSON = true;
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
  var JSONloader;
  var gridImg; // grid image, to avoid looping the grid every frame

    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight);
      img = p.createGraphics(p.width, p.height);
      JSONloader = p.createFileInput(p.handleJSON);
      JSONloader.hide();
    };
    p.handleJSON = (file) => {
      if(file.subtype === "json") {
        PARAMS.frames = [];
        PARAMS.frames = file.data;
        
        frames.children.forEach((oldBind) => { oldBind.dispose(); });
        PARAMS.frames.forEach((frame, i) => {
          let paletteOptions;
          switch(paleta.value) {
            default:
            case 4:
              paletteOptions = [
                {text: 'Laranja Energético', value: coresRGB.laranjaEnergetico},
                {text: 'Verde Vibrante', value: coresRGB.verdeVibrante},
                {text: 'Cinza Alto', value: coresRGB.cinzaAlto},
                {text: 'Cinza Escuro', value: coresRGB.cinzaEscuro}
              ]
              break;
            case 6:
              paletteOptions = [
                {text: 'Laranja Energético', value: coresRGB.laranjaEnergetico},
                {text: 'Verde Vibrante', value: coresRGB.verdeVibrante},
                {text: 'Cinza Claro', value: coresRGB.cinzaClaro},
                {text: 'Cinza Baixo', value: coresRGB.cinzaBaixo},
                {text: 'Cinza Alto', value: coresRGB.cinzaAlto},
                {text: 'Cinza Escuro', value: coresRGB.cinzaEscuro}
              ]
              break;
          }

          var corFrame;
          if(paleta.value == 1) {
            corFrame = frames.addBinding(frame, 'color', { label: "Forma "+(i+1) });
          } else {
            paletteOptions.forEach((option) => {
              if(frame.color.r == option.value.r && frame.color.g == option.value.g && frame.color.b == option.value.b && frame.color.a == option.value.a) {
                frame.color = option.value;
              }
            });
            corFrame = frames.addBlade({ label: "Forma "+(i+1), view: 'list',
              options: paletteOptions,
              value: frame.color
            }).on('change', () => { frame.color = corFrame.value });
          }
          //frame.colorOptions = corFrame;
        });

      } else {
        p.print("Please choose a JSON file.");
      }
    }

    p.draw = () => {
      let bgColor = PARAMS.bg;
      if(paleta.value != 1) bgColor = corFundo.value;

      if(exportingJSON) {
        let savedJSON = [];
        PARAMS.frames.forEach((frame) => {
          savedJSON.push({
            x: frame.x,
            y: frame.y,
            w: frame.w,
            h: frame.h,
            color: {r: frame.color.r, g: frame.color.g, b: frame.color.b, a: frame.color.a}
          });
        });
        p.saveJSON(savedJSON, "partnership.json");
        exportingJSON = false;
      }
      if(importingJSON) {
        JSONloader.elt.click();
        importingJSON = false;
      }

      if(newGridSize && PARAMS.viewGrid) {
        gridImg = p.createGraphics(p.width, p.height);
        grid(p.width/PARAMS.gridSize, p.height/PARAMS.gridSize, (i, j) => {
          let s = PARAMS.gridSize;
          gridImg.noFill();

          gridImg.strokeWeight(1);
          //p.stroke(PARAMS.gridColor.r, PARAMS.gridColor.g, PARAMS.gridColor.b, PARAMS.squareOpacity);
          gridImg.stroke(corGrid.value, PARAMS.squareOpacity);
          gridImg.square(i*s, j*s, s);

          //p.stroke(PARAMS.gridColor.r, PARAMS.gridColor.g, PARAMS.gridColor.b, PARAMS.circleOpacity);
          gridImg.stroke(corGrid.value, PARAMS.circleOpacity);
          gridImg.ellipseMode(p.CORNER);
          gridImg.circle(i*s, j*s, s);
        });
        newGridSize = false;
      }

      if(saving) {
        let saveSize = PARAMS.gridSize * saveInfo.quality;
        let saveRadius = PARAMS.borderRadius * saveInfo.quality;

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
            img.rect(etapa.x*saveSize, etapa.y*saveSize, etapa.w*saveSize, etapa.h*saveSize, saveSize*saveRadius);
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
            img.rect(etapa.x*saveSize, etapa.y*saveSize, etapa.w*saveSize, etapa.h*saveSize, saveSize*saveRadius);
            if(s+1 > anim.quality) {
              img.fill(anim.color.r, anim.color.g, anim.color.b, anim.color.a*255);
              img.noStroke();
              img.rect(anim.x*saveSize, anim.y*saveSize, anim.w*saveSize, anim.h*saveSize, saveSize*saveRadius);
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
      if(PARAMS.frames.length > 1) easeType.hidden = false; else easeType.hidden = true;
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
              //p.stroke(PARAMS.gridColor.r, PARAMS.gridColor.g, PARAMS.gridColor.b, PARAMS.squareOpacity);
              p.stroke(corGrid.value, PARAMS.squareOpacity);
              p.square(i*s, j*s, s);
              p.ellipseMode(p.CORNER);
              //p.stroke(PARAMS.gridColor.r, PARAMS.gridColor.g, PARAMS.gridColor.b, PARAMS.circleOpacity);
              p.stroke(corGrid.value, PARAMS.circleOpacity);
              p.circle(i*s, j*s, s);
            });
          }
        }
        
        p.animate(); // check function below (after draw)

        // old debug
        //if(p.mouseY > 100) p.frameRate(60); else p.frameRate(2);

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
          p.rect(frame.x*PARAMS.gridSize, frame.y*PARAMS.gridSize, frame.w*PARAMS.gridSize, frame.h*PARAMS.gridSize, PARAMS.gridSize*PARAMS.borderRadius);
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
          p.rect(frame.x*PARAMS.gridSize, frame.y*PARAMS.gridSize, frame.w*PARAMS.gridSize, frame.h*PARAMS.gridSize, PARAMS.gridSize*PARAMS.borderRadius);
        } else novaForma = {};

        // circles and squares grid
        if(PARAMS.viewGrid) {
          // optimize this: use image instead of loop. change img (loop inside createGraphics) when user changes gridSize.

          p.image(gridImg, 0, 0);

          // grid(p.width/PARAMS.gridSize, p.height/PARAMS.gridSize, (i, j) => {
          //   let s = PARAMS.gridSize;
          //   p.noFill();

          //   p.strokeWeight(1);
          //   //p.stroke(PARAMS.gridColor.r, PARAMS.gridColor.g, PARAMS.gridColor.b, PARAMS.squareOpacity);
          //   p.stroke(corGrid.value, PARAMS.squareOpacity);
          //   p.square(i*s, j*s, s);

          //   //p.stroke(PARAMS.gridColor.r, PARAMS.gridColor.g, PARAMS.gridColor.b, PARAMS.circleOpacity);
          //   p.stroke(corGrid.value, PARAMS.circleOpacity);
          //   p.ellipseMode(p.CORNER);
          //   p.circle(i*s, j*s, s);
          // });
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
          p.rect(frame.x*PARAMS.gridSize, frame.y*PARAMS.gridSize, frame.w*PARAMS.gridSize, frame.h*PARAMS.gridSize, PARAMS.gridSize*PARAMS.borderRadius);
        });
        
        // selection circle (the one that shows where your mouse is and has a dashed circle)
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
      if((anim.step).toFixed(2) < PARAMS.frames.length-1) {
        // anim.progress = parseFloat(anim.progress.toFixed(2));
        // anim.step = parseFloat(anim.step.toFixed(2));

        let previous = { color: {} };
        // numbers too close to zero result in e-16, used nf. edit: changed nf to toFixed(2) bc nf returned a string... tofixed also returns a string. im cooked. my final attempt is using parsefloat
        let previousStep = ((anim.step).toFixed(2)%1).toFixed(2) - (anim.speed/1000).toFixed(2);
        // previousStep = easeInSine( p.nf( (anim.progress-anim.speed/1000) % 1, 1, 2) ); // COMPLETELY WRONG idk why. below is correct version
        // fixed the conversion of progress below
        let previousProgress = ((anim.progress).toFixed(2)%1).toFixed(2) - (anim.speed/1000).toFixed(2);
        previousStep = parseFloat(currentEase( previousProgress ));

        if(previousProgress >= 0) {

          // the line below fixes a bug where some frames painted a frame ahead instantly
          if(anim.step%1 == 0 && previousStep != 0) anim.step -= 0.001;

          //anim.progress = parseFloat(anim.progress.toFixed(2));
          //anim.step = parseFloat(anim.step.toFixed(2));

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
        } else if(anim.step >= 0.9 && previousProgress < 0) {
          anim.progress = parseFloat(anim.progress.toFixed(2));
          anim.step = parseFloat(anim.step.toFixed(2));
          anim.step = p.int(anim.step);
          previousStep = parseFloat(currentEase( previousProgress + 1 ));
          
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

          // the following code fixed gaps that happened when both previous and anim were at the same place
          if(previous.x == anim.x && previous.y == anim.y) {
            let nextStep = parseFloat(currentEase( (anim.speed/1000).toFixed(2) ));
            anim.x = p.lerp(PARAMS.frames[p.int(anim.step)].x, PARAMS.frames[p.int(anim.step)+1].x, nextStep);
            anim.x = p.lerp(PARAMS.frames[p.int(anim.step)].x, PARAMS.frames[p.int(anim.step)+1].x, nextStep);
            anim.y = p.lerp(PARAMS.frames[p.int(anim.step)].y, PARAMS.frames[p.int(anim.step)+1].y, nextStep);
            anim.w = p.lerp(PARAMS.frames[p.int(anim.step)].w, PARAMS.frames[p.int(anim.step)+1].w, nextStep);
            anim.h = p.lerp(PARAMS.frames[p.int(anim.step)].h, PARAMS.frames[p.int(anim.step)+1].h, nextStep);
            anim.color.r = p.lerp(PARAMS.frames[p.int(anim.step)].color.r, PARAMS.frames[p.int(anim.step)+1].color.r, nextStep);
            anim.color.g = p.lerp(PARAMS.frames[p.int(anim.step)].color.g, PARAMS.frames[p.int(anim.step)+1].color.g, nextStep);
            anim.color.b = p.lerp(PARAMS.frames[p.int(anim.step)].color.b, PARAMS.frames[p.int(anim.step)+1].color.b, nextStep);
            anim.color.a = p.lerp(PARAMS.frames[p.int(anim.step)].color.a, PARAMS.frames[p.int(anim.step)+1].color.a, nextStep);
          }
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
          p.rect(etapa.x*PARAMS.gridSize, etapa.y*PARAMS.gridSize, etapa.w*PARAMS.gridSize, etapa.h*PARAMS.gridSize, PARAMS.gridSize*PARAMS.borderRadius);
          //p.fill(0); p.stroke(255); p.strokeWeight(2);
          //p.text(p.nf(anim.step, 1, 2)+" | "+p.nf(previousProgress, 1, 2)+" | "+p.nf(previousStep, 1, 2), etapa.x*PARAMS.gridSize, etapa.y*PARAMS.gridSize);
        }
      } else if(!anim.finished) { // only enters here if anim.step >= PARAMS.frames.length-1 (if the step is beyond the last frame)
        
        anim.progress = parseFloat(anim.progress.toFixed(2));
        anim.step = parseFloat(anim.step.toFixed(2));
        
        let previous = { color: {} };
        let previousStep = ((anim.step).toFixed(2)%1).toFixed(2) - (anim.speed/1000).toFixed(2); // this is wrong, we shouldnt use this
        // this fixed the "going back in the end" issue. switched below "p.float(p.nf(anim.progress%1, 1, 2))" by "(anim.progress).toFixed(2)%1"
        let previousProgress = ((anim.progress).toFixed(2)%1).toFixed(2) - (anim.speed/1000).toFixed(2);
        // previousStep = easeInSine( p.nf( (anim.progress-anim.speed/1000) % 1, 1, 2) ); // completely wrong, idk why, ignore
        if(previousProgress < 0) previousStep = currentEase( previousProgress + 1 );
        else previousStep = currentEase( previousProgress );
        
        // i seriously don't know why i need this next line but it BREAKS if i don't have it
        if(p.float(p.nf(anim.progress%1, 1, 2)) == p.float(p.nf(anim.speed/1000, 1, 2))) previousStep += 1;

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
          p.rect(etapa.x*PARAMS.gridSize, etapa.y*PARAMS.gridSize, etapa.w*PARAMS.gridSize, etapa.h*PARAMS.gridSize, PARAMS.gridSize*PARAMS.borderRadius);
          // this if makes sure the very LAST frame is drawn
          if(s+1 >= anim.quality) {
            p.fill(anim.color.r, anim.color.g, anim.color.b, anim.color.a*255);
            p.noStroke();
            p.rect(anim.x*PARAMS.gridSize, anim.y*PARAMS.gridSize, anim.w*PARAMS.gridSize, anim.h*PARAMS.gridSize, PARAMS.gridSize*PARAMS.borderRadius);
          }
        }
        anim.finished = true;
      }
      
      if(anim.progress < PARAMS.frames.length) {
        // tofixed(2) doesn't seem to work below, idk why. answer: it returns a string
        anim.progress += p.float((p.nf(anim.speed/1000, 1, 2)));
        // anim.progress += anim.speed/1000;
        switch(easeType.value) {
          case "linear":
            anim.step = anim.progress;
            break;
          default:
            anim.step = p.int(anim.progress) + parseFloat(currentEase((anim.progress % 1).toFixed(2)));
            break;
        }
      }

      if(anim.loop && anim.progress >= PARAMS.frames.length) {
        anim.progress = 0;
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
            let chosenColor;
            switch(PARAMS.frames.length % paleta.value) {
              case 0: chosenColor = coresRGB.laranjaEnergetico; break;
              case 1: chosenColor = coresRGB.verdeVibrante; break;
              case 2: chosenColor = coresRGB.cinzaAlto; break;
              case 3: chosenColor = coresRGB.cinzaEscuro; break;
              case 4: chosenColor = coresRGB.cinzaBaixo; break;
              case 5: chosenColor = coresRGB.cinzaClaro; break;
            }
            // p.print(chosenColor);
            // chosenColor = { ...chosenColor };
            // p.print(chosenColor);
            PARAMS.frames.push({
              x: p.min(novaForma.startX, novaForma.endX),
              y: p.min(novaForma.startY, novaForma.endY),
              w: p.abs(novaForma.endX - novaForma.startX) + 1,
              h: p.abs(novaForma.endY - novaForma.startY) + 1,
              // color: chosenColor
              color: paleta.value == 1 ? { ...chosenColor } : chosenColor
              // color: {
              //   r: p.color(cores[PARAMS.frames.length%4]).levels[0],
              //   g: p.color(cores[PARAMS.frames.length%4]).levels[1],
              //   b: p.color(cores[PARAMS.frames.length%4]).levels[2],
              //   a: p.color(cores[PARAMS.frames.length%4]).levels[3]/255,
              // }
            });
          } else if(hoveringX && clickOnX) PARAMS.frames.splice(p.max(hoveringFrames), 1);

          frames.children.forEach((oldBind) => { oldBind.dispose(); });
          PARAMS.frames.forEach((frame, i) => {
            let paletteOptions;
            switch(paleta.value) {
              default:
              case 4:
                paletteOptions = [
                  {text: 'Laranja Energético', value: coresRGB.laranjaEnergetico},
                  {text: 'Verde Vibrante', value: coresRGB.verdeVibrante},
                  {text: 'Cinza Alto', value: coresRGB.cinzaAlto},
                  {text: 'Cinza Escuro', value: coresRGB.cinzaEscuro}
                ]
                break;
              case 6:
                paletteOptions = [
                  {text: 'Laranja Energético', value: coresRGB.laranjaEnergetico},
                  {text: 'Verde Vibrante', value: coresRGB.verdeVibrante},
                  {text: 'Cinza Claro', value: coresRGB.cinzaClaro},
                  {text: 'Cinza Baixo', value: coresRGB.cinzaBaixo},
                  {text: 'Cinza Alto', value: coresRGB.cinzaAlto},
                  {text: 'Cinza Escuro', value: coresRGB.cinzaEscuro}
                ]
                break;
            }

            var corFrame;
            if(paleta.value == 1) {
              corFrame = frames.addBinding(frame, 'color', { label: "Forma "+(i+1) });
            } else {
              paletteOptions.forEach((option) => {
                if(frame.color.r == option.value.r && frame.color.g == option.value.g && frame.color.b == option.value.b && frame.color.a == option.value.a) {
                  frame.color = option.value;
                }
              });
              corFrame = frames.addBlade({ label: "Forma "+(i+1), view: 'list',
                options: paletteOptions,
                value: frame.color
              }).on('change', () => { frame.color = corFrame.value });
            }
            //frame.colorOptions = corFrame;

            // const corFrame = frames.addBlade({ label: "Forma "+(i+1), view: 'list',
            //   options: paletteOptions,
            //   value: frame.color
            // }).on('change', () => { frame.color = corFrame.value });
            // frame.colorOptions = corFrame;

            // frames.addBinding(frame, 'color', { label: "Frame "+(i+1) });
            // const corFrame = frames.addBlade({ label: "Forma "+(i+1), view: 'list',
            //   options: [
            //     {text: 'Cinza Escuro', value: coresRGB.cinzaEscuro},
            //     {text: 'Cinza Alto', value: coresRGB.cinzaAlto},
            //     {text: 'Cinza Baixo', value: coresRGB.cinzaBaixo},
            //     {text: 'Cinza Claro', value: coresRGB.cinzaClaro},
            //     {text: 'Verde Vibrante', value: coresRGB.verdeVibrante},
            //     {text: 'Laranja Energético', value: coresRGB.laranjaEnergetico},
            //   ],
            //   value: frame.color
            // }).on('change', () => { frame.color = corFrame.value });
            // frame.colorOptions = corFrame;
          });
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

function currentEase(valueToEase) {
  switch(easeType.value) {
    default: case "linear": return valueToEase.toFixed(2)%1;
    case "easeInSine": return easeInSine(valueToEase).toFixed(2);
    case "easeOutSine": return easeOutSine(valueToEase).toFixed(2);
    case "easeInOutSine": return easeInOutSine(valueToEase).toFixed(2);
    case "easeInQuad": return easeInQuad(valueToEase).toFixed(2);
    case "easeOutQuad": return easeOutQuad(valueToEase).toFixed(2);
    case "easeInOutQuad": return easeInOutQuad(valueToEase).toFixed(2);
    case "easeInCubic": return easeInCubic(valueToEase).toFixed(2);
    case "easeOutCubic": return easeOutCubic(valueToEase).toFixed(2);
    case "easeInOutCubic": return easeInOutCubic(valueToEase).toFixed(2);
    case "easeInQuart": return easeInQuart(valueToEase).toFixed(2);
    case "easeOutQuart": return easeOutQuart(valueToEase).toFixed(2);
    case "easeInOutQuart": return easeInOutQuart(valueToEase).toFixed(2);
    case "easeInQuint": return easeInQuint(valueToEase).toFixed(2);
    case "easeOutQuint": return easeOutQuint(valueToEase).toFixed(2);
    case "easeInOutQuint": return easeInOutQuint(valueToEase).toFixed(2);
    case "easeInExpo": return easeInExpo(valueToEase).toFixed(2);
    case "easeOutExpo": return easeOutExpo(valueToEase).toFixed(2);
    case "easeInOutExpo": return easeInOutExpo(valueToEase).toFixed(2);
    case "easeInCirc": return easeInCirc(valueToEase).toFixed(2);
    case "easeOutCirc": return easeOutCirc(valueToEase).toFixed(2);
    case "easeInOutCirc": return easeInOutCirc(valueToEase).toFixed(2);
    case "easeInBack": return easeInBack(valueToEase).toFixed(2);
    case "easeOutBack": return easeOutBack(valueToEase).toFixed(2);
    case "easeInOutBack": return easeInOutBack(valueToEase).toFixed(2);
    case "easeInElastic": return easeInElastic(valueToEase).toFixed(2);
    case "easeOutElastic": return easeOutElastic(valueToEase).toFixed(2);
    case "easeInOutElastic": return easeInOutElastic(valueToEase).toFixed(2);
    case "easeOutBounce": return easeOutBounce(valueToEase).toFixed(2);
    case "easeInBounce": return easeInBounce(valueToEase).toFixed(2);
    case "easeInOutBounce": return easeInOutBounce(valueToEase).toFixed(2);
  }
}