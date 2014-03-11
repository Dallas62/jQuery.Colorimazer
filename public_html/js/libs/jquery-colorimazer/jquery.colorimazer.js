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
    
    function lightnessGrayscale(r, g, b) {
        // Grayscale by (max(R, G, B) + min(R, G, B)) / 2
        var value = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
        return {
            r: value,
            g: value,
            b: value
        };
    }
    
    function averageGrayscale(r, g, b) {
        // Grayscale by  (R + G + B) / 3
        var value = (r + g + b) / 3;
        return {
            r: value,
            g: value,
            b: value
        };
    }
    
    function luminosityGrayscale(r, g, b) {
        // Grayscale by 0.21 R + 0.71 G + 0.07 B
        var value = (r * 0.21 + g * 0.71 + b * 0.07);
        return {
            r: value,
            g: value,
            b: value
        };
    }
    
    // Handler for grayscale
    function handlerGrayscale(informations, options) {
        // Handle all pixels
        for(var i = 0; i < informations.data.length; i += 4) {
            var r = informations.data[i];
            var g = informations.data[i + 1];
            var b = informations.data[i + 2];
            
            // Default scale
            var scale = {r: r, g: g, b: b};
            
            switch(options.mode) {
                case "lightness":
                    // Applying lightness grayscale
                    scale = lightnessGrayscale(r, g, b);
                    break;
                
                case "luminosity":
                    // Applying luminosity grayscale
                    scale = luminosityGrayscale(r, g, b);
                    break;
                    
                case "average":
                    // Applying average grayscale
                    scale = averageGrayscale(r, g, b);
                    break;
            }

            // Applying scale
            informations.data[i] = scale.r;
            informations.data[i + 1] = scale.g;
            informations.data[i + 2] = scale.b;
        }
    }
    
    // Request the canvas
    function getCanvas($el) {
        // Instanciating the canvas
        var canvas = document.createElement("canvas");
        
        // Ask for image
        var image = $el.get(0);
        
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
    
    function handler($el, parameters) {
        // Checking if it's an image
        if($el.is("img")) {
            // get informations
            var infos = getCanvas($el);

            // handle the action
            switch(parameters.action) {
                case "grayscale":
                    // Call the grayscale handler
                    handlerGrayscale(infos, parameters.options);
                    break;
            }

            // Redraw the canvas
            infos.context.putImageData(infos.image, 0, 0);
                
            // Apply on the image
            $el.attr("src", infos.canvas.toDataURL());
        }
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
            
            // Act for all elements
            return this.each(function()
            {
                // Handle them
                handler($(this), parameters);
            });
        }
    });
   
})(jQuery);