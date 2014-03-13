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
                    var prepend = function(scale, options) {
                        if(typeof options.prepend !== "undefined" &&
                            $.isFunction(options.prepend)) {
                            options.prepend(scale);
                        }
                    };
                    
                    return {
                        add: function(scale, options) {
                            prepend(scale, options);
                            
                            scale.r = filterMinMax(scale.r + 255 * options.r, 0, 255);
                            scale.g = filterMinMax(scale.g + 255 * options.g, 0, 255);
                            scale.b = filterMinMax(scale.b + 255 * options.b, 0, 255);
                        },
                        multiply: function(scale, options) {
                            prepend(scale, options);
                            
                            scale.r = filterMinMax(scale.r + scale.r * options.r, 0, 255);
                            scale.g = filterMinMax(scale.g + scale.g * options.g, 0, 255);
                            scale.b = filterMinMax(scale.b + scale.b * options.b, 0, 255);
                        },
                        replace: function(scale, options) {
                            prepend(scale, options);
                            
                            if(options.r >= 0) {
                                scale.r = filterMinMax(options.r * 255, 0, 255);
                            }
                            if(options.g >= 0) {
                                scale.g = filterMinMax(options.g * 255, 0, 255);
                            }
                            if(options.b >= 0) {
                                scale.b = filterMinMax(options.b * 255, 0, 255);
                            }
                        }
                    };
                })(),
                
                // effects algorithms
                effect: (function(){
                    return {
                        inverse: function(scale) {
                            scale.r = 255 - scale.r;
                            scale.g = 255 - scale.g;
                            scale.b = 255 - scale.b;
                        },
                        
                        solarize: function(scale, options) {
                            var intensity = options.intensity(scale);
                            if(options.operator === "greater" && intensity >= options.solarize) {
                                scale.r = 255 - scale.r;
                                scale.g = 255 - scale.g;
                                scale.b = 255 - scale.b;
                            } else if(options.operator === "less" && intensity <= options.solarize) {
                                scale.r = 255 - scale.r;
                                scale.g = 255 - scale.g;
                                scale.b = 255 - scale.b;
                            }
                        }
                    };
                })(),
                
                // Hue algorithms
                hue: (function(){
                    return {
                        add: function(scale, options) {
                            // Convert to HSV, add options, convert to RGB
                            var hsv = RGBtoHSV(scale.r, scale.g, scale.b);

                            hsv.h = (hsv.h + options.hue) % 360;

                            if(options.saturation >= 0) {
                                hsv.s = (options.saturation / 100) % 1;
                            }

                            if(options.value >= 0) {
                                hsv.v = (options.value / 100) % 1;
                            }

                            var rgb = HSVtoRGB(hsv.h, hsv.s, hsv.v);

                            scale.r = rgb.r;
                            scale.g = rgb.g;
                            scale.b = rgb.b;
                        }
                    };
                })(),
                
                // intensity algorithms
                intensity: (function(){
                    return {
                        average: function(scale) {
                            // intensity by  (R + G + B) / 3
                            return (scale.r + scale.g + scale.b) / 3;
                        },
                        lightness: function(scale) {
                            // intensity by (max(R, G, B) + min(R, G, B)) / 2
                            return (Math.max(scale.r, scale.g, scale.b) 
                                  + Math.min(scale.r, scale.g, scale.b)) / 2;
                        },
                        luminosity: function(scale) {
                            // intensity by 0.2126 R + 0.7152 G + 0.0722 B
                            return (scale.r * 0.2126 + scale.g * 0.7152 + scale.b * 0.0722);
                        },
                        natural: function(scale) {
                            // intensity by 0.299 R + 0.587 G + 0.114 B
                            return (scale.r * 0.299 + scale.g * 0.587 + scale.b * 0.114);
                        }
                    };
                })(),
                
                // Opacity algorithms
                opacity: (function(){
                    return {
                        add: function(scale, options) {
                            scale.a = filterMinMax(scale.a + 255 * options.opacity, 0, 255);
                        },
                        multiply: function(scale, options) {
                            scale.a = filterMinMax(scale.a  + scale.a * options.opacity, 0, 255);
                        },
                        replace: function(scale, options) {
                            scale.a = filterMinMax(options.opacity * 255, 0, 255);
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
                canvas: canvas,
                context: ctx,
                image: imageData,
                data: imageData.data
            };
        };
        
        // Execute algorithm
        var execute = function(informations, action, options) {
            // Handle all pixels
            for(var i = 0; i < informations.data.length; i += 4) {
                var r = informations.data[i];
                var g = informations.data[i + 1];
                var b = informations.data[i + 2];
                var a = informations.data[i + 3];

                // Default scale
                var scale = {r: r, g: g, b: b, a: a};

                // handle the action
                action(scale, options);

                // Applying scale
                informations.data[i] = scale.r;
                informations.data[i + 1] = scale.g;
                informations.data[i + 2] = scale.b;
                informations.data[i + 3] = scale.a;
            }
        };
        
        // Handlers
        return {
            // Handler of the plugin
            colorimazer: function(image, action, options) {
                // get informations
                var informations = extract(image);

                var algorithm = null;

                // Select the right algorithm
                switch(action) {
                    case "colorize":
                        // Call the inverse handler
                        if(typeof options.grayscale !== "undefined" &&
                                  options.grayscale !== "") {
                            // On ajoute le calque gris
                            var intensity = this.grayscale({
                                            mode: options.grayscale
                                        });
                        
                            options.prepend = function(scale) {
                                scale.r = scale.g = scale.b = intensity(scale);
                            };
                        }
                        algorithm = this.colorize(options);
                        break;

                    case "custom":
                        // Call the custom algorithm
                        algorithm = options;
                        break;
                        
                    case "grayscale":
                        // Call the grayscale handler
                        var intensity = this.grayscale(options);
                        
                        algorithm = function(scale) {
                            scale.r = scale.g = scale.b = intensity(scale);
                        };
                        break;

                    case "hue":
                        // Call the hue handler
                        algorithm = this.hue(options);
                        break;

                    case "effect":
                        // Call the inverse handler
                        if(typeof options.intensity !== "undefined" &&
                                  options.intensity !== "") {
                            // On ajoute le calque gris
                            options.intensity = 
                                    this.grayscale({
                                        mode: options.intensity
                                    });
                        }
                        // Call the inverse handler
                        algorithm = this.effect(options);
                        break;

                    case "opacity":
                        // Call the inverse handler
                        algorithm = this.opacity(options);
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
                
                return image;
            },
            
            // Colorize handler
            colorize: function(options){
                switch(options.mode) {
                    case "replace":
                        // Applying replace color
                        return algorithms.colorize.replace;

                    case "add":
                        // Applying add color
                        return algorithms.colorize.add;

                    case "multiply":
                        // Applying multiply color
                        return algorithms.colorize.multiply;
                }
            },
            
            // effect handler
            effect: function(options){
                switch(options.mode) {
                    case "inverse":
                        // Applying inverse
                        return algorithms.effect.inverse;
                        
                    case "solarize":
                        // Applying inverse
                        return algorithms.effect.solarize;
                 }
            },
            
            // Grayscale handler
            grayscale: function(options){
                switch(options.mode) {
                    case "lightness":
                        // Applying lightness grayscale
                        return algorithms.intensity.lightness;

                    case "luminosity":
                        // Applying luminosity grayscale
                        return algorithms.intensity.luminosity;

                    case "natural":
                        // Applying natural grayscale
                        return algorithms.intensity.natural;
                        
                    default:
                        // Applying average grayscale
                        return algorithms.intensity.average;
                }
            },
            
            // Hue handler
            hue: function(options){
                switch(options.mode) {
                    case "add":
                        // Applying hue
                        return algorithms.hue.add;
                }
            },
            
            // Opacity handler
            opacity: function(options){
                switch(options.mode) {
                    case "replace":
                        // Applying replace opacity
                        return algorithms.opacity.replace;

                    case "add":
                        // Applying add opacity
                        return algorithms.opacity.add;

                    case "multiply":
                        // Applying multiply opacity
                        return algorithms.opacity.multiply;
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
            
            grayscale: function(options) {
                options = $.extend({}, {
                        mode: "average"
                    },
                    options
                );
        
                return options;
            },
            hue: function(options) {
                var hue = 0;

                // Check parameter
                if($.isNumeric(options)) {
                    hue = options;
                }

                options = $.extend({}, {
                        mode: "add",
                        hue: hue,
                        saturation: -1,
                        value: -1
                    },
                    options
                );

                // correct the angle
                while(options.hue < 0) {
                    options.hue += 360;
                }
                
                return options;
            },
            inverse: function(options) {
                options = $.extend({}, {
                        mode: "inverse"
                    },
                    options
                );
                
                return options;
            },
            solarize: function(options) {
                options = $.extend({}, {
                        mode: "solarize",
                        intensity: "average",
                        solarize: 128,
                        operator: "less"
                    },
                    options
                );
                
                return options;
            },
            opacity: function(options) {
                var opacity = 0;
            
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
    
    var each = function($this, action, options) {
        // Act for all elements
        return $this.each(function()
        {
            if($(this).is("img")) {
                // Queue event
                $(this).queue(function() {
                    // New image
                    var image = new Image();
                    var $el = $(this);
                    
                    // Handle load
                    image.onload = function() {
                        // Disable callback
                        this.onload = null;
                        
                        // Apply change on image
                        handlers.colorimazer(this, action, options);
                                                
                        // When load, call next
                        $el.one("load", function(){
                            $el.dequeue();
                        });
                        
                        // Apply on current
                        $el.attr("src", this.src);
                    };
                    
                    // Copy image from source
                    image.src = $(this).attr("src");
                });
            }
        });
    }
    
    $.extend($.fn, {
        // SAVE AND RESTORE
        save: function() {
            // Saving all elements
            return this.each(function(){
                // Checking if is already saved element
                if($(this).hasClass("colorimazer-original-save") === false) {
                    // Copying element
                    var copy = $(this).clone();
                    
                    // Changing ID
                    copy.attr("id", $(this).attr("id") + "-colorimazer");
                    
                    // Adding saved element class
                    copy.addClass("colorimazer-original-save");

                    // Inserting the element
                    $(this).after(copy);
                    
                    // Hiding the element
                    copy.hide(0);
                }
            });
        },

        restore: function() {
            // Restoring all elements
            this.each(function() {
                // Checking if is saved
                if($(this).hasClass("colorimazer-original-save") === false) {
                    
                    // Trying with the ID of a saved element
                    $("#" + $(this).attr("id") + "-colorimazer").restore();

                } else {
                    // Removing the deprecated element
                    $("#" + $(this).attr("id").replace("-colorimazer", "")).remove();
                    
                    // Restoring the element with the right ID
                    $(this).attr("id", $(this).attr("id").replace("-colorimazer", ""));
                    
                    // Displaying the element
                    $(this).show(0);
                    
                    // Removing the class
                    $(this).removeClass("colorimazer-original-save");
                }
            });
            
            // Return the new list with the same selector
            return $(this.selector);
        },
        // END OF SAVE AND RESTORE
        
        // ALGORITHMS
        colorize: function(options) {
            return each(this, "colorize", 
                 defaults.colorize(options)
            );
        },
        
        custom: function(options) {
            if($.isFunction(options)) {
                return each(this, "custom", options);
            }
        },
        
        grayscale: function(options) {
            return each(this, "grayscale", 
                defaults.grayscale(options)
            );
        },
        
        hue: function(options) {
            return each(this, "hue", 
                defaults.hue(options)
            );
        },
        
        inverse: function(options) {
            return each(this, "effect", 
                defaults.inverse(options)
            );
        },
        
        solarize: function(options) {
            return each(this, "effect", 
                defaults.solarize(options)
            );
        },
        
        opacity: function(options) {
            return each(this, "opacity", 
                defaults.opacity(options)
            );
        }
    });
})(jQuery);