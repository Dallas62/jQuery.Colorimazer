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
    function HSVtoRGB(h, s, v) {
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
                case 0:
                    r = v;
                    g = t;
                    b = p;
                    break;
                case 1:
                    r = q;
                    g = v;
                    b = p;
                    break;
                case 2:
                    r = p;
                    g = v;
                    b = t;
                    break;
                case 3:
                    r = p;
                    g = q;
                    b = v;
                    break;
                case 4:
                    r = t;
                    g = p;
                    b = v;
                    break;
                default:
                    r = v;
                    g = p;
                    b = q;
            }
        }
        return {
            r: Math.round(r * 255) ,
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
    
    function RGBtoHSV(r, g, b) {
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
    }
    
    var lightnessGrayscaleAlgorithm = function(scale, options) {
        // Grayscale by (max(R, G, B) + min(R, G, B)) / 2
        var value = (Math.max(scale.r, scale.g, scale.b) 
                   + Math.min(scale.r, scale.g, scale.b)) / 2;
        
        scale.r = scale.g = scale.b = value;
    };
    
    var averageGrayscaleAlgorithm = function(scale, options) {
        // Grayscale by  (R + G + B) / 3
        var value = (scale.r + scale.g + scale.b) / 3;
        
        scale.r = scale.g = scale.b = value;
    };
    
    var luminosityGrayscaleAlgorithm = function (scale, options) {
        // Grayscale by 0.21 R + 0.71 G + 0.07 B
        var value = (scale.r * 0.21 + scale.g * 0.71 + scale.b * 0.07);
        
        scale.r = scale.g = scale.b = value;
    };
    
    var hueAlgorithm = function (scale, options) {
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
    };
    
    var inverseAlgorithm = function (scale, options) {
        scale.r = 255 - scale.r;
        scale.g = 255 - scale.g;
        scale.b = 255 - scale.b;
    };
    
    
    // Handler for hue
    function handlerGrayscale(options) {
        switch(options.mode) {
            case "lightness":
                // Applying lightness grayscale
                return lightnessGrayscaleAlgorithm;
                
            case "luminosity":
                // Applying luminosity grayscale
                return luminosityGrayscaleAlgorithm;
                    
            case "average":
                // Applying average grayscale
                return averageGrayscaleAlgorithm;
        }
    }
    
    // Handler for hue
    function handlerHue(options) {
        return hueAlgorithm;
    }
    
    // Handler for inverse
    function handlerInverse(options) {
        return inverseAlgorithm;
    }
    
    // Request the canvas
    function getCanvas(image) {
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
    }
    
    function handler(image, parameters) {
        // get informations
        var informations = getCanvas(image);

        var action = function() {};

        // Select the right algorithm
        switch(parameters.action) {
            case "grayscale":
                // Call the grayscale handler
                action = handlerGrayscale(parameters.options);
                break;

            case "hue":
                // Call the hue handler
                action = handlerHue(parameters.options);
                break;

            case "inverse":
                // Call the inverse handler
                action = handlerInverse(parameters.options);
                break;

            case "custom":
                // Call the custom algorithm
                action = parameters.options;
                break;
        }

        // Execute algotihm
        executeAlgorithm(informations, action, parameters.options);

        // Redraw the canvas
        informations.context.putImageData(informations.image, 0, 0);
        
        // Apply on the image
        image.src = informations.canvas.toDataURL();
        
        return image;
    }
    
    function executeAlgorithm(informations, action, options) {
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
    }
    
    function executeForeach($this, parameters) {
        
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
                        handler(this, parameters);
                                                
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
    
    $.extend($.fn,
    {
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
        
        grayscale: function(options)
        {
            // Extending default configuration
            options = $.extend({}, {
                    mode: "average"
                },
                options
            );
            
            // Creating the default parameters for the handler
            var parameters = {
                
                action: "grayscale",
                
                options: options
            };
            
            return executeForeach(this, parameters);
        },
        
        hue: function(options)
        {
            var hue = 0;
            
            // Check parameter
            if($.isNumeric(options)) {
                hue = options;
            }
            
            // Extending default configuration
            options = $.extend({}, {
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
        
            // Creating the default parameters for the handler
            var parameters = {
                
                action: "hue",
                
                options: options
            };
            
            // Act for all elements
            return executeForeach(this, parameters);
        },
        
        inverse: function(options)
        {
            // Creating the default parameters for the handler
            var parameters = {

                action: "inverse",

                options: options
            };

            // Act for all elements
            return executeForeach(this, parameters);
        },
        
        custom: function(options)
        {
            if($.isFunction(options)) {
                // Creating the default parameters for the handler
                var parameters = {

                    action: "custom",

                    options: options
                };

                // Act for all elements
                return executeForeach(this, parameters);
            }
        }
    });
   
})(jQuery);