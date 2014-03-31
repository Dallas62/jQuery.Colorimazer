/* 
 * The MIT License
 *
 * Copyright 2014 Tacyniak Boris.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

$(document).ready(function(){
    
    // Grayscale
//    $("#gray").custom(function(pixel, options, informations) {
//        var r = 0; var g = 0; var b = 0; var count = 0;
//        for(var i = -5; i <= 2; i ++) {
//            for (var j = -4; j <= 0; j++) {
//                var pix = informations.pixel(pixel.x + i, pixel.y + j);
//                if(pix !== null) {
//                    count++;
//                    r += pix.r;
//                    g += pix.g;
//                    b += pix.b;
//                }
//            }
//        }
//        pixel.r = r / count;
//        pixel.g = g / count;
//        pixel.b = b / count;
//    });
//    
    
    $("#gray").grayscale();
    
    $("#grayn").grayscale({mode: "natural"});
    $("#graylu").grayscale({mode: "luminosity"});
    $("#grayli").grayscale({mode: "lightness"});
    $("#grayr").grayscale({mode: "red"});
    $("#grayb").grayscale({mode: "green"});
    $("#grayg").grayscale({mode: "blue"});
    
    // Effect
    $("#inverse").effect({mode: "inverse"});
    
    $("#solarizeless").effect({mode: "solarize"});
    $("#solarizegreater").effect({mode: "solarize", operator: "greater"});
    $("#solarizecustom").effect({mode: "solarize", solarize: 25, intensity: "natural"});
    
    $("#blur").effect({ mode: "blur" });
    $("#blur5").effect({ mode: "blur", radius: 5 });
    $("#blur9").effect({ mode: "blur", radius: 9 });
    // Hue
    $("#hue180").hue(180);
    
    $("#huesat").hue({ mode: "add", saturation: -55 });
    $("#huevalue").hue({ mode: "add", value: 40 });
    $("#hue180satvalue").hue({ mode: "add", hue: 180, saturation: -55, value: 40 });
    
    // Colorize
    $("#colorizered").colorize({ g: 25 });
    
    $("#colorizegray").colorize({ grayscale: "average", g: 25 });
    $("#colorizereplace").colorize({ mode: "replace", g: 25 });
    $("#colorizemultiply").colorize({ mode: "multiply", g: 25 });
});