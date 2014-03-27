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

(function($)
{
    var handlers = (function() {
        
        // Algorithms
        var algorithms = (function() {
            // Convert HSV to RGB
            var HSVtoRGB = function(h, s, v) {
                var r, g, b, i, f, p, q, t;
                if(s === 0) {
                    r = g = b = v;
                }
                else
                {
                    h /= 60;

                    i = Math.floor(h);
                    f = h - i;
                    p = v * (1 - s);
                    q = v * (1 - s * f);
                    t = v * (1 - s * (1 - f));

                    switch (i) {
                        case 0:  r = v; g = t; b = p; break;
                        case 1:  r = q; g = v; b = p; break;
                        case 2:  r = p; g = v; b = t; break;
                        case 3:  r = p; g = q; b = v; break;
                        case 4:  r = t; g = p; b = v; break;
                        default: r = v; g = p; b = q;
                    }
                }
                return {
                    r: Math.round(r * 255),
                    g: Math.round(g * 255),
                    b: Math.round(b * 255)
                };
            };

            // Convert RGB to HSV
            var RGBtoHSV = function(r, g, b) {
                var min = Math.min(r, g, b);
                var max = Math.max(r, g, b);
                var v = max / 255;
                var s = 0;
                var h = -1;
                var delta = max - min;

                if(max !== 0) {
                    s = delta / max;

                    if(r === max) {
                        h = (g - b) / delta;
                    } else if (g === max) {
                        h = 2 + (b - r) / delta;
                    } else {
                        h = 4 + (r - g) / delta;
                    }
                }

                h *= 60;

                while(h < 0) {
                    h += 360;
                }

                return {
                    h: h,
                    s: s,
                    v: v
                };
            };

            var filterMinMax = function(value, min, max) {
                // min of [434, 255] = 255, max [-213, 0] = 0
                // so max of [ min of [x, 255], 0] ->  0 <= result <= 255
                return Math.max(Math.min(value, max), min);
            };
            
            return {
                colorize: (function(){
                    // Applying prepend grayscale
                    var prepend = function(pixel, options) {
                        if(typeof options.prepend !== "undefined" &&
                            $.isFunction(options.prepend)) {
                            options.prepend(pixel);
                        }
                    };
                    
                    return {
                        add: function(pixel, options) {
                            prepend(pixel, options);
                            
                            pixel.r = filterMinMax(pixel.r + 255 * options.r, 0, 255);
                            pixel.g = filterMinMax(pixel.g + 255 * options.g, 0, 255);
                            pixel.b = filterMinMax(pixel.b + 255 * options.b, 0, 255);
                        },
                        multiply: function(pixel, options) {
                            prepend(pixel, options);
                            
                            pixel.r = filterMinMax(pixel.r + pixel.r * options.r, 0, 255);
                            pixel.g = filterMinMax(pixel.g + pixel.g * options.g, 0, 255);
                            pixel.b = filterMinMax(pixel.b + pixel.b * options.b, 0, 255);
                        },
                        replace: function(pixel, options) {
                            prepend(pixel, options);
                            
                            if(options.r >= 0) {
                                pixel.r = filterMinMax(options.r * 255, 0, 255);
                            }
                            if(options.g >= 0) {
                                pixel.g = filterMinMax(options.g * 255, 0, 255);
                            }
                            if(options.b >= 0) {
                                pixel.b = filterMinMax(options.b * 255, 0, 255);
                            }
                        }
                    };
                })(),
                
                // effects algorithms
                effect: (function(){
                    return {
                        inverse: function(pixel) {
                            pixel.r = 255 - pixel.r;
                            pixel.g = 255 - pixel.g;
                            pixel.b = 255 - pixel.b;
                        },
                        
                        solarize: function(pixel, options) {
                            var intensity = options.intensity(pixel);
                            
                            if(options.operator === "greater" && intensity >= options.solarize * 2.55  ||
                               options.operator === "less"    && intensity <= options.solarize * 2.55 ) {
                                algorithms.effect.inverse(pixel);
                            }
                        }
                    };
                })(),
                
                // grayscale algorithms
                grayscale: (function(){
                    return {
                        average: function(pixel) {
                            pixel.r = pixel.g = pixel.b = algorithms.intensity.average(pixel);
                        },
                        lightness: function(pixel) {
                            pixel.r = pixel.g = pixel.b = algorithms.intensity.lightness(pixel);
                        },
                        luminosity: function(pixel) {
                            pixel.r = pixel.g = pixel.b = algorithms.intensity.luminosity(pixel);
                        },
                        natural: function(pixel) {
                            pixel.r = pixel.g = pixel.b = algorithms.intensity.natural(pixel);
                        },
                        red: function(pixel) {
                            pixel.r = pixel.g = pixel.b = algorithms.intensity.red(pixel);
                        },
                        green: function(pixel) {
                            pixel.r = pixel.g = pixel.b = algorithms.intensity.green(pixel);
                        },
                        blue: function(pixel) {
                            pixel.r = pixel.g = pixel.b = algorithms.intensity.blue(pixel);
                        }
                    };
                })(),
                
                // Hue algorithms
                hue: (function(){
                    return {
                        add: function(pixel, options) {
                            // Convert to HSV, add options, convert to RGB
                            var hsv = RGBtoHSV(pixel.r, pixel.g, pixel.b);

                            hsv.h = (hsv.h + options.hue) % 360;

                            hsv.s = filterMinMax(hsv.s + options.saturation / 100, 0, 1);
                            hsv.v = filterMinMax(hsv.v + options.value / 100, 0, 1);

                            var rgb = HSVtoRGB(hsv.h, hsv.s, hsv.v);

                            pixel.r = rgb.r;
                            pixel.g = rgb.g;
                            pixel.b = rgb.b;
                        },
                        multiply: function(pixel, options) {
                            // Convert to HSV, add options, convert to RGB
                            var hsv = RGBtoHSV(pixel.r, pixel.g, pixel.b);

                            hsv.h = (hsv.h + options.hue) % 360;

                            hsv.s = filterMinMax(hsv.s + hsv.s * options.saturation / 100, 0, 1);
                            hsv.v = filterMinMax(hsv.v + hsv.v * options.value / 100, 0, 1);
                            

                            var rgb = HSVtoRGB(hsv.h, hsv.s, hsv.v);

                            pixel.r = rgb.r;
                            pixel.g = rgb.g;
                            pixel.b = rgb.b;
                        },
                        replace: function(pixel, options) {
                            // Convert to HSV, add options, convert to RGB
                            var hsv = RGBtoHSV(pixel.r, pixel.g, pixel.b);

                            hsv.h = (hsv.h + options.hue) % 360;

                            if(options.saturation >= 0) {
                                hsv.s = filterMinMax(options.saturation / 100, 0, 1);
                            }

                            if(options.value >= 0) {
                                hsv.v =  filterMinMax(options.value / 100, 0, 1);
                            }

                            var rgb = HSVtoRGB(hsv.h, hsv.s, hsv.v);

                            pixel.r = rgb.r;
                            pixel.g = rgb.g;
                            pixel.b = rgb.b;
                        }
                    };
                })(),
                
                // intensity algorithms
                intensity: (function(){
                    return {
                        average: function(pixel) {
                            // intensity by  (R + G + B) / 3
                            return (pixel.r + pixel.g + pixel.b) / 3;
                        },
                        lightness: function(pixel) {
                            // intensity by (max(R, G, B) + min(R, G, B)) / 2
                            return (Math.max(pixel.r, pixel.g, pixel.b) 
                                  + Math.min(pixel.r, pixel.g, pixel.b)) / 2;
                        },
                        luminosity: function(pixel) {
                            // intensity by 0.2126 R + 0.7152 G + 0.0722 B
                            return (pixel.r * 0.2126 + pixel.g * 0.7152 + pixel.b * 0.0722);
                        },
                        natural: function(pixel) {
                            // intensity by 0.299 R + 0.587 G + 0.114 B
                            return (pixel.r * 0.299 + pixel.g * 0.587 + pixel.b * 0.114);
                        },
                        red: function(pixel) {
                            return pixel.r;
                        },
                        green: function(pixel) {
                            return pixel.g;
                        },
                        blue: function(pixel) {
                            return pixel.b;
                        }
                    };
                })(),
                
                // Opacity algorithms
                opacity: (function(){
                    return {
                        add: function(pixel, options) {
                            pixel.a = filterMinMax(pixel.a + 255 * options.opacity, 0, 255);
                        },
                        multiply: function(pixel, options) {
                            pixel.a = filterMinMax(pixel.a  + pixel.a * options.opacity, 0, 255);
                        },
                        replace: function(pixel, options) {
                            pixel.a = filterMinMax(options.opacity * 255, 0, 255);
                        }
                    };
                })()
            };
        })();
        
        // Extract informations of the canvas
        var extract = function(image) {
            // Instanciating the canvas
            var canvas = document.createElement("canvas");

            // Adding size
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;

            // Drawing original image
            canvas.getContext("2d").drawImage(image, 0, 0);

            // Extracting context and image data
            var ctx = canvas.getContext("2d");
            var imageData = ctx.getImageData(0, 0, image.naturalWidth, image.naturalHeight);

            // return an object of informations
            return {
                width: image.naturalWidth,
                height: image.naturalHeight,
                canvas: canvas,
                context: ctx,
                image: imageData,
                data: imageData.data,
                pixel: function(x, y, pixel) {
                    if(typeof pixel === "undefined") {
                        // get the pixel
                        if(x >= 0 && x < this.width &&
                           y >= 0 && y < this.height) {
                            
                            var i = 4 * (y * this.width + x);
                            
                            return {
                                x: x,
                                y: y,
                                r: this.data[i],
                                g: this.data[i + 1],
                                b: this.data[i + 2],
                                a: this.data[i + 3]
                            };
                        }
                    } else if(x >= 0 && x < this.width &&
                              y >= 0 && y < this.height) {
                        // set the pixel
                        
                        var i = 4 * (y * this.width + x);
                        
                        this.data[i] = pixel.r;
                        this.data[i + 1] = pixel.g;
                        this.data[i + 2] = pixel.b;
                        this.data[i + 3] = pixel.a;
                    }
                    return null;
                }
            };
        };
        
        // Execute algorithm
        var execute = function(informations, algorithm, options) {
            for(var x = 0; x < informations.width; x++) {
                
                for(var y = 0; y < informations.height; y++) {
                    
                    // get
                    var pixel = informations.pixel(x, y);
                    
                    // handle the action
                    algorithm(pixel, options, informations);
                    
                    // set
                    informations.pixel(x, y, pixel);
                }
            }
        };
        
        var getAlgorithm = function(action, options) {
            // searching for algorithm
            if(algorithms.hasOwnProperty(action)) {
                if(options.hasOwnProperty("mode")) {
                    if(algorithms[action].hasOwnProperty(options.mode)) {
                        return algorithms[action][options.mode];
                    }
                }
            }
            
            return null;
        };
        
        // Handlers
        return {
            // Handler of the plugin
            colorimazer: function(image, action, options) {
                // get informations
                var informations = extract(image);

                var algorithm = getAlgorithm(action, options);

                // Select the right algorithm
                switch(action) {
                    case "colorize":
                        // Call the inverse handler
                        if(typeof options.grayscale !== "undefined" &&
                                  options.grayscale !== "") {
                              
                            options.prepend = getAlgorithm("grayscale", {
                                mode: options.grayscale
                            });
                        }
                        break;

                    case "custom":
                        // Call the custom algorithm
                        algorithm = options.fn;
                        break;
                        
                    case "effect":
                        // Call the inverse handler
                        if(typeof options.intensity !== "undefined" &&
                                  options.intensity !== "") {
                            // On ajoute le calque gris
                            options.intensity =  getAlgorithm("intensity", {
                                mode: options.intensity
                            });
                        }
                        break;
                }
                
                // If an algorithm is defined, run it
                if($.isFunction(algorithm)) {
                    // Execute algotihm
                    execute(informations, algorithm, options);

                    // Redraw the canvas
                    informations.context.putImageData(informations.image, 0, 0);

                    // Apply on the image
                    image.src = informations.canvas.toDataURL();
                }
            }
        };
    })();
    
    var defaults = (function(){
        return {
            colorize: function(options){
                if($.isPlainObject(options)) {
                    if(typeof options.mode !== "undefined"){
                        if(options.mode === "replace") {
                            // Extending default configuration for replace
                            options = $.extend({}, {
                                    r: -1,
                                    g: -1,
                                    b: -1
                                },
                                options
                            );
                        }
                    }
                }

                options = $.extend({}, {
                        mode: "add",
                        r: 0,
                        g: 0,
                        b: 0
                    },
                    options
                );

                options.r /= 100;
                options.g /= 100;
                options.b /= 100;
                
                return options;
            },
            
            custom: function(options) {
                if($.isFunction(options)) {
                    options = $.extend({}, {
                            fn: options
                        }
                    );
                }
                
                return $.extend({}, options);
            },
            
            grayscale: function(options) {
                return $.extend({}, {
                        mode: "average"
                    },
                    options
                );
            },
            
            hue: function(options) {
                var hue = 0;

                // Check parameter
                if($.isNumeric(options)) {
                    hue = options;
                } else if($.isPlainObject(options)) {
                    if(typeof options.mode !== "undefined"){
                        if(options.mode === "replace") {
                            // Extending default configuration for replace
                            options = $.extend({}, {
                                    saturation: -1,
                                    value: -1
                                },
                                options
                            );
                        }
                    }
                }

                options = $.extend({}, {
                        mode: "add",
                        hue: hue,
                        saturation: 0,
                        value: 0
                    },
                    options
                );
                
                // correct the angle
                while(options.hue < 0) {
                    options.hue += 360;
                }
                
                return options;
            },
            
            effect: (function(){
                return {
                    inverse: function(options) {
                        return $.extend({}, {
                                mode: "inverse"
                            },
                            options
                        );
                    },

                    solarize: function(options) {
                        return $.extend({}, {
                                mode: "solarize",
                                intensity: "average",
                                solarize: 50,
                                operator: "less"
                            },
                            options
                        );
                    }
                };
            })(),

            opacity: function(options) {
                var opacity = 255;

                // Check parameter
                if($.isNumeric(options)) {
                    opacity = options;
                }

                options = $.extend({}, {
                        opacity: opacity,
                        mode: "replace"
                    },
                    options
                );

                options.opacity /= 100;

                return options;
            }
        };
    })();
    
    var each = function(action, options) {
        // Act for all elements
        return this.queue(function() {
            if($(this).is("img")) {
                // New image
                var image = new Image();
                var $el = $(this);
                
                // Handle load
                image.onload = function() {
                    
                    // Disable callback
                    this.onload = null;
                        
                    // Apply change on image
                    handlers.colorimazer(this, action, options);
                    
                    if($el.attr("src") === this.src) {
                        
                        $el.dequeue();
                        
                    } else {
                        // When load, call next
                        $el.one("load", function() {
                            $el.dequeue();
                        });

                        // Apply on current
                        $el.attr("src", this.src);
                    }
                };

                // Copy image from source
                image.src = $(this).attr("src");
            } else {
                $el.dequeue();
            }
        });
    };
    
    $.extend($.fn, {
        // SAVE AND RESTORE
        save: function() {
            return this.queue(function() {
                if($(this).is("img") && $(this).attr("src") !== undefined) {
                    
                    $(this).attr("data-colorimazer-save", $(this).attr("src"));
                }

                $(this).dequeue();
            });
        },

        restore: function() {
            return this.queue(function() {
                
                if($(this).is("img") && $(this).attr("data-colorimazer-save") !== undefined) {
                    $(this).attr("src", $(this).attr("data-colorimazer-save"));
                }

                $(this).dequeue();
            });
        },
        // END OF SAVE AND RESTORE
        
        // ALGORITHMS
        colorize: function(options) {
            return each.call(this, "colorize", 
                 defaults.colorize(options)
            );
        },
        
        custom: function(options) {
            return each.call(this, "custom", 
                defaults.custom(options)
            );
        },
        
        grayscale: function(options) {
            return each.call(this, "grayscale", 
                defaults.grayscale(options)
            );
        },
        
        hue: function(options) {
            return each.call(this, "hue", 
                defaults.hue(options)
            );
        },
        
        effect: function(options) {
            if($.isPlainObject(options)) {
                if(typeof options.mode !== "undefined") {
                    if(defaults.effect.hasOwnProperty(options.mode)) {
                        return each.call(this, "effect",
                            defaults.effect[options.mode](options)
                        );
                    }
                }
            }
        },
        
        opacity: function(options) {
            return each.call(this, "opacity", 
                defaults.opacity(options)
            );
        }
    });
})(jQuery);