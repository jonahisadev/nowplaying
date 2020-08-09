// Init
var canvas = document.getElementById('display');
var context = canvas.getContext('2d');
var text = "Now Playing: ";
canvas.width = window.innerWidth;

// Font size
var size = 50;

// Render
function render() {
    // Clear
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Make sure we fit
    context.font = `bold ${size}px arial`;
    var txt_width = context.measureText(text).width;
    while (txt_width > canvas.width) {
        size--;
        txt_width = context.measureText(text).width;
        context.font = `bold ${size}px arial`;
    }

    // Write text
    context.fillStyle = `rgba(${color}, ${opacity})`;
    context.fillText(text, (canvas.width / 2) - (txt_width / 2), 38);

    // Outline
    if (outline) {
        context.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
        context.lineWidth = 2;
        context.strokeText(text, (canvas.width / 2) - (txt_width / 2), 38);
    }

    // Render
    window.requestAnimationFrame(render);
}

// Check now playing
function check_now_playing() {
    if (!DEMO) {
        fetch('/nowplaying?id=' + document.getElementById('id').value)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    console.log("Error: " + data.error);
                    return;
                }

                if (size != 50)
                    size = 50;
                text = "Now Playing: " + data.str;
            });
    }
}

// Init call
check_now_playing();

// Check every 5 seconds
setInterval(check_now_playing, 1000 * 5);

// Call render
window.requestAnimationFrame(render);

// Stay the same
window.onresize = (e) => {
    canvas.width = window.innerWidth;
}