// Global slections and variables
const colorDivs = document.querySelectorAll('.color');
const generateBtn = document.querySelector('.generate');
const saveBtn = document.querySelector('.save');
const deleteBtn = document.querySelector('.delete');
const adjustBtn = document.querySelectorAll('.adjust');
const closeAdjustments = document.querySelectorAll('.close-adjustment');
const lockBtns = document.querySelectorAll('.lock');

const sliders = document.querySelectorAll('input[type=range]');
const currentHexes = document.querySelectorAll('.color h2');
const popup = document.querySelector('.copy-container');
const sliderContainers = document.querySelectorAll('.sliders');

// Library selectors
const libraryContainer = document.querySelector('.library-container');
const libraryBtn = document.querySelector('.library');
const closeLibraryBtn = document.querySelector('.close-library');

// Save selectors
const submitSave = document.querySelector('.submit-save');
const closeSave = document.querySelector('.close-save');
const saveContainer = document.querySelector('.save-container');
const saveInput = document.querySelector('.save-container input');

// Reference colors for manipulation
let initialColors;

// This is for local storage
let savedPaletts = [];

// Event listeners
generateBtn.addEventListener('click', randomColors);

saveBtn.addEventListener('click', openPalette);

closeSave.addEventListener('click', closePalette);

submitSave.addEventListener('click', savePalette);

libraryBtn.addEventListener('click', openLibrary);

closeLibraryBtn.addEventListener('click', closeLibrary);

deleteBtn.addEventListener('click', clearLibrary);

sliders.forEach(slider =>{
    slider.addEventListener('input', hslControls);
})

colorDivs.forEach((div, index) => {
    div.addEventListener('change', () => {
        updateTextUI(index);
    })
})

currentHexes.forEach(hex => {
    hex.addEventListener('click', () => {
        copyToClipboard(hex);
    })
})

popup.addEventListener('transitionend', () => {
    const popupBox = popup.children[0];
    popup.classList.remove('active');
    popupBox.classList.remove('active');
})

adjustBtn.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        openAdjustmentPanel(index);
    })
})

closeAdjustments.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        openAdjustmentPanel(index);
    })
})

lockBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        lockColor(index);
    });
})

// Functions

// Color generator
function generateHex() {
    const hexColor = chroma.random();
    return hexColor;
}

// Randomize colors
function randomColors() {
    // Save initial colors
    initialColors = [];
    colorDivs.forEach((div, index) => {
        const hexText = div.children[0];
        const randomColor = generateHex();
        // Add hex to the array
        if(div.classList.contains('locked')) {
            initialColors.push(hexText.innerText);
            return;
        } else {
            initialColors.push(chroma(randomColor).hex());
        }

        // Add the color to background
        div.style.backgroundColor = randomColor;
        hexText.innerText = randomColor;

        // Check for contrast
        checkTextContrast(randomColor, hexText);

        // Initialize Colorize Sliders
        const color = chroma(randomColor);
        const sliders = div.querySelectorAll('.sliders input');
        const hue = sliders[0];
        const brightness = sliders[1];
        const saturation = sliders[2];

        colorizeSliders(color, hue, brightness, saturation);
    });

    // Reset inputs
    resetInputs();

    //Checkfor button contrast
    adjustBtn.forEach((btn, index) => {
        checkTextContrast(initialColors[index], btn);
        checkTextContrast(initialColors[index], lockBtns[index]);
    })
}

function checkTextContrast(color, text) {
    const luminance = chroma(color).luminance();
    if(luminance > 0.5) {
        text.style.color = 'black';
    } else {
        text.style.color = 'white';
    }
}

function colorizeSliders(color, hue, brightness, saturation) {
    // Scale sturation
    const noSat = color.set('hsl.s', 0);
    const fullSat = color.set('hsl.s', 1);
    const scaleSat = chroma.scale([noSat, color, fullSat]);

    // Scale brightness
    const midBright = color.set('hsl.l', 0.5);
    const scaleBright = chroma.scale(['black', midBright, 'white']);

    // Update input colors
    saturation.style.backgroundImage = `linear-gradient(to right, ${scaleSat(0)}, ${scaleSat(1)})`;
    brightness.style.backgroundImage = `linear-gradient(to right, ${scaleBright(0)},${scaleBright(0.5)}, ${scaleBright(1)})`;

    hue.style.backgroundImage = `linear-gradient(to right, rgb(204, 75, 75), rgb(204, 204, 75), rgb(75, 204, 75), rgb(75, 204, 204), rgb(75, 75, 204), rgb(204, 75, 204), rgb(204, 75, 75))`
}

function hslControls(e) {
    const index = e.target.getAttribute('data-bright') || e.target.getAttribute('data-sat') || e.target.getAttribute('data-hue');
    
    let sliders = e.target.parentElement.querySelectorAll('input[type="range');

    const hue = sliders[0];
    const brightness = sliders[1];
    const saturation = sliders[2];

    const bgColor = initialColors[index];

    let color = chroma(bgColor)
    .set('hsl.s', saturation.value)
    .set('hsl.l', brightness.value)
    .set('hsl.h', hue.value);

    colorDivs[index].style.backgroundColor = color;

    // Colorize inputs
    colorizeSliders(color, hue, brightness, saturation);
}

function updateTextUI(index) {
    const activeDiv = colorDivs[index];
    const color = chroma(activeDiv.style.backgroundColor);
    const textHex = activeDiv.querySelector('h2');
    const icons = activeDiv.querySelectorAll('.controls button');
    textHex.innerText = color.hex();

    // Check contrast
    checkTextContrast(color, textHex);
    for(icon of icons) {
        checkTextContrast(color, icon);
    }
}

function resetInputs() {
    const sliders = document.querySelectorAll('.sliders input');
    sliders.forEach(slider => {
        // Update hue
        if(slider.name === 'hue') {
            const hueColor = initialColors[slider.getAttribute('data-hue')];
            const hueValue = chroma(hueColor).hsl()[0];
            slider.value = Math.floor(hueValue);
        }

        // Update saturation
        if(slider.name === 'saturation') {
            const satColor = initialColors[slider.getAttribute('data-sat')];
            const satValue = chroma(satColor).hsl()[1];
            slider.value = Math.floor(satValue * 100) / 100;
        }

        // Update brightness
        if(slider.name === 'brightness') {
            const brightColor = initialColors[slider.getAttribute('data-bright')];
            const brightValue = chroma(brightColor).hsl()[2];
            slider.value = Math.floor(brightValue * 100) / 100;
        }
    })
}

function copyToClipboard(hex) {
    const el = document.createElement('textarea');
    el.value = hex.innerText;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy'); // Check out Clipboard API
    document.body.removeChild(el);

    // Popup animation
    const popupBox = popup.children[0];
    popup.classList.add('active');
    popupBox.classList.add('active'); 

}

function openAdjustmentPanel(index) {
    sliderContainers[index].classList.toggle('active');
}

function closeAdjustmentPanel(index) {
    sliderContainers[index].classList.remove('active');
}

function lockColor(index) {
    colorDivs[index].classList.toggle('locked');
    //lockBtns[index].classList.toggle('locked');
    if(colorDivs[index].classList.contains('locked')) {
        lockBtns[index].firstChild.classList.remove('fa-lock-open');
        lockBtns[index].firstChild.classList.add('fa-lock');
    } else {
        lockBtns[index].firstChild.classList.add('fa-lock-open');
        lockBtns[index].firstChild.classList.remove('fa-lock');
    }
}

function openPalette(e) {
    const popup = saveContainer.children[0];
    saveContainer.classList.add('active');
    popup.classList.add('active');
}

function closePalette(e) {
    const popup = saveContainer.children[0];
    saveContainer.classList.remove('active');
    popup.classList.remove('active');
}

function savePalette(e) {
    saveContainer.classList.remove('active');
    popup.classList.remove('active');
    const name = saveInput.value;
    const colors = [];
    currentHexes.forEach(hex => {
        colors.push(hex.innerText);
    })

    // Generate object
    //let paletteNr = savedPaletts.length;
    let paletteNr;
    const paletteObjects = JSON.parse(localStorage.getItem('palettes'));
    if(paletteObjects){
        paletteNr = paletteObjects.length;
    } else {
        paletteNr = savedPaletts.length;
    }

    const paletteObj = {name, colors, nr: paletteNr,};
    savedPaletts.push(paletteObj);

    // Save to local storage
    saveToLocal(paletteObj);
    saveInput.value = '';

    // Generate the palette for library
    const palette = document.createElement('div');
    palette.classList.add('custom-palette');

    const title = document.createElement('h4');
    title.innerText = paletteObj.name;

    const preview = document.createElement('div');
    preview.classList.add('small-preview');

    paletteObj.colors.forEach(smallColor => {
        const smallDiv = document.createElement('div');
        smallDiv.style.backgroundColor = smallColor;
        preview.appendChild(smallDiv)
    });

    const paletteBtn = document.createElement('button');
    paletteBtn.classList.add('pick-palette-btn');
    paletteBtn.classList.add(paletteObj.nr);
    paletteBtn.innerText = 'Select';

    // Attach event to the btn
    paletteBtn.addEventListener('click', e => {
        closeLibrary();
        const paletteIndex = e.target.classList[1];
        initialColors = [];
        savedPaletts[paletteIndex].colors.forEach((color, index) =>{
            initialColors.push(color);
            colorDivs[index].style.backgroundColor = color;
            const text = colorDivs[index].children[0];
            checkTextContrast(color, text);
            updateTextUI(index);
        })
        resetInputs();
    })

    // Append to library
    palette.appendChild(title);
    palette.appendChild(preview);
    palette.appendChild(paletteBtn);
    libraryContainer.children[0].appendChild(palette);
}

function saveToLocal(paletteObj) {
    let localPalettes;

    if(!localStorage.getItem('palettes')) {
        localPalettes = [];
    } else {
        localPalettes = JSON.parse(localStorage.getItem('palettes'));
    }

    localPalettes.push(paletteObj);
    localStorage.setItem('palettes', JSON.stringify(localPalettes));
}

function openLibrary() {
    const popup = libraryContainer.children[0];
    libraryContainer.classList.add('active');
    popup.classList.add('active');
}

function closeLibrary() {
    const popup = libraryContainer.children[0];
    libraryContainer.classList.remove('active');
    popup.classList.remove('active');
}

function getLocal() {
    if(!localStorage.getItem('palettes')) {
        localPalettes = [];
    } else {
        const paletteObjects = JSON.parse(localStorage.getItem('palettes'));

        savedPaletts = [...paletteObjects];

        paletteObjects.forEach(paletteObj => {
            // Generate the palette for library
            const palette = document.createElement('div');
            palette.classList.add('custom-palette');

            const title = document.createElement('h4');
            title.innerText = paletteObj.name;

            const preview = document.createElement('div');
            preview.classList.add('small-preview');

            paletteObj.colors.forEach(smallColor => {
                const smallDiv = document.createElement('div');
                smallDiv.style.backgroundColor = smallColor;
                preview.appendChild(smallDiv)
            });

            const paletteBtn = document.createElement('button');
            paletteBtn.classList.add('pick-palette-btn');
            paletteBtn.classList.add(paletteObj.nr);
            paletteBtn.innerText = 'Select';

            // Attach event to the btn
            paletteBtn.addEventListener('click', e => {
                closeLibrary();
                const paletteIndex = e.target.classList[1];
                //const paletteIndex = paletteObjects.nr;
                initialColors = [];
                paletteObjects[paletteIndex].colors.forEach((color, index) =>{
                    initialColors.push(color);
                    colorDivs[index].style.backgroundColor = color;
                    const text = colorDivs[index].children[0];
                    checkTextContrast(color, text);
                    updateTextUI(index);
                })
                resetInputs();
            })

            // Append to library
            palette.appendChild(title);
            palette.appendChild(preview);
            palette.appendChild(paletteBtn);
            libraryContainer.children[0].appendChild(palette);
        })
    }
}

function clearLibrary() {
    localStorage.removeItem('palettes');
    //savedPaletts = [];
}

getLocal();
randomColors();