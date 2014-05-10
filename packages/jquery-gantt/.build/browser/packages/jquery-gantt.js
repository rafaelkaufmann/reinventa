(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/jquery-gantt/lib/jquery.fn.gantt.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// jQuery Gantt Chart                                                                                                  // 1
// ==================                                                                                                  // 2
                                                                                                                       // 3
// Basic usage:                                                                                                        // 4
                                                                                                                       // 5
//      $(".selector").gantt({                                                                                         // 6
//          source: "ajax/data.json",                                                                                  // 7
//          scale: "weeks",                                                                                            // 8
//          minScale: "weeks",                                                                                         // 9
//          maxScale: "months",                                                                                        // 10
//          onItemClick: function(data) {                                                                              // 11
//              alert("Item clicked - show some details");                                                             // 12
//          },                                                                                                         // 13
//          onAddClick: function(dt, rowId) {                                                                          // 14
//              alert("Empty space clicked - add an item!");                                                           // 15
//          },                                                                                                         // 16
//          onRender: function() {                                                                                     // 17
//              console.log("chart rendered");                                                                         // 18
//          }                                                                                                          // 19
//      });                                                                                                            // 20
                                                                                                                       // 21
//                                                                                                                     // 22
/*jshint shadow:true, laxbreak:true, jquery:true, strict:true, trailing:true */                                        // 23
(function ($, undefined) {                                                                                             // 24
                                                                                                                       // 25
    "use strict";                                                                                                      // 26
                                                                                                                       // 27
    $.fn.gantt = function (options) {                                                                                  // 28
                                                                                                                       // 29
        var cookieKey = "jquery.fn.gantt";                                                                             // 30
        var scales = ["hours", "days", "weeks", "months"];                                                             // 31
        //Default settings                                                                                             // 32
        var settings = {                                                                                               // 33
            source: [],                                                                                                // 34
            itemsPerPage: 7,                                                                                           // 35
            months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            dow: ["S", "M", "T", "W", "T", "F", "S"],                                                                  // 37
            navigate: "buttons",                                                                                       // 38
            scale: "days",                                                                                             // 39
            useCookie: false,                                                                                          // 40
            maxScale: "months",                                                                                        // 41
            minScale: "hours",                                                                                         // 42
            waitText: "Please wait...",                                                                                // 43
            onItemClick: function (data) { return; },                                                                  // 44
            onAddClick: function (data) { return; },                                                                   // 45
            onRender: function() { return; },                                                                          // 46
            scrollToToday: true                                                                                        // 47
        };                                                                                                             // 48
                                                                                                                       // 49
        /**                                                                                                            // 50
        * Extend options with default values                                                                           // 51
        */                                                                                                             // 52
        if (options) {                                                                                                 // 53
            $.extend(settings, options);                                                                               // 54
        }                                                                                                              // 55
                                                                                                                       // 56
        // can't use cookie if don't have `$.cookie`                                                                   // 57
        settings.useCookie = settings.useCookie && $.isFunction($.cookie);                                             // 58
                                                                                                                       // 59
        // custom selector `:findday` used to match on specified day in ms.                                            // 60
        //                                                                                                             // 61
        // The selector is passed a date in ms and elements are added to the                                           // 62
        // selection filter if the element date matches, as determined by the                                          // 63
        // id attribute containing a parsable date in ms.                                                              // 64
        $.extend($.expr[":"], {                                                                                        // 65
            findday: function (a, i, m) {                                                                              // 66
                var cd = new Date(parseInt(m[3], 10));                                                                 // 67
                var id = $(a).attr("id");                                                                              // 68
                id = id ? id : "";                                                                                     // 69
                var si = id.indexOf("-") + 1;                                                                          // 70
                var ed = new Date(parseInt(id.substring(si, id.length), 10));                                          // 71
                cd = new Date(cd.getFullYear(), cd.getMonth(), cd.getDate());                                          // 72
                ed = new Date(ed.getFullYear(), ed.getMonth(), ed.getDate());                                          // 73
                return cd.getTime() === ed.getTime();                                                                  // 74
            }                                                                                                          // 75
        });                                                                                                            // 76
        // custom selector `:findweek` used to match on specified week in ms.                                          // 77
        $.extend($.expr[":"], {                                                                                        // 78
            findweek: function (a, i, m) {                                                                             // 79
                var cd = new Date(parseInt(m[3], 10));                                                                 // 80
                var id = $(a).attr("id");                                                                              // 81
                id = id ? id : "";                                                                                     // 82
                var si = id.indexOf("-") + 1;                                                                          // 83
                cd = cd.getFullYear() + "-" + cd.getDayForWeek().getWeekOfYear();                                      // 84
                var ed = id.substring(si, id.length);                                                                  // 85
                return cd === ed;                                                                                      // 86
            }                                                                                                          // 87
        });                                                                                                            // 88
        // custom selector `:findmonth` used to match on specified month in ms.                                        // 89
        $.extend($.expr[":"], {                                                                                        // 90
            findmonth: function (a, i, m) {                                                                            // 91
                var cd = new Date(parseInt(m[3], 10));                                                                 // 92
                cd = cd.getFullYear() + "-" + cd.getMonth();                                                           // 93
                var id = $(a).attr("id");                                                                              // 94
                id = id ? id : "";                                                                                     // 95
                var si = id.indexOf("-") + 1;                                                                          // 96
                var ed = id.substring(si, id.length);                                                                  // 97
                return cd === ed;                                                                                      // 98
            }                                                                                                          // 99
        });                                                                                                            // 100
                                                                                                                       // 101
        // Date prototype helpers                                                                                      // 102
        // ======================                                                                                      // 103
                                                                                                                       // 104
        // `getWeekId` returns a string in the form of 'dh-YYYY-WW', where WW is                                       // 105
        // the week # for the year.                                                                                    // 106
        // It is used to add an id to the week divs                                                                    // 107
        Date.prototype.getWeekId = function () {                                                                       // 108
            var y = this.getFullYear();                                                                                // 109
            var w = this.getDayForWeek().getWeekOfYear();                                                              // 110
            var m = this.getMonth();                                                                                   // 111
            if (m === 11 && w === 1) {                                                                                 // 112
                y++;                                                                                                   // 113
            }                                                                                                          // 114
            return 'dh-' + y + "-" + w;                                                                                // 115
        };                                                                                                             // 116
                                                                                                                       // 117
        // `getRepDate` returns the seconds since the epoch for a given date                                           // 118
        // depending on the active scale                                                                               // 119
        Date.prototype.getRepDate = function () {                                                                      // 120
            switch (settings.scale) {                                                                                  // 121
                case "hours":                                                                                          // 122
                    return this.getTime();                                                                             // 123
                case "weeks":                                                                                          // 124
                    return this.getDayForWeek().getTime();                                                             // 125
                case "months":                                                                                         // 126
                    return new Date(this.getFullYear(), this.getMonth(), 1).getTime();                                 // 127
                default:                                                                                               // 128
                    return this.getTime();                                                                             // 129
            }                                                                                                          // 130
        };                                                                                                             // 131
                                                                                                                       // 132
        // `getDayOfYear` returns the day number for the year                                                          // 133
        Date.prototype.getDayOfYear = function () {                                                                    // 134
            var fd = new Date(this.getFullYear(), 0, 0);                                                               // 135
            var sd = new Date(this.getFullYear(), this.getMonth(), this.getDate());                                    // 136
            return Math.ceil((sd - fd) / 86400000);                                                                    // 137
        };                                                                                                             // 138
                                                                                                                       // 139
        // `getWeekOfYear` returns the week number for the year                                                        // 140
        Date.prototype.getWeekOfYear = function () {                                                                   // 141
            var ys = new Date(this.getFullYear(), 0, 1);                                                               // 142
            var sd = new Date(this.getFullYear(), this.getMonth(), this.getDate());                                    // 143
            if (ys.getDay() > 3) {                                                                                     // 144
                ys = new Date(sd.getFullYear(), 0, (7 - ys.getDay()));                                                 // 145
            }                                                                                                          // 146
            var daysCount = sd.getDayOfYear() - ys.getDayOfYear();                                                     // 147
            return Math.ceil(daysCount / 7);                                                                           // 148
                                                                                                                       // 149
        };                                                                                                             // 150
                                                                                                                       // 151
        // `getDaysInMonth` returns the number of days in a month                                                      // 152
        Date.prototype.getDaysInMonth = function () {                                                                  // 153
            return 32 - new Date(this.getFullYear(), this.getMonth(), 32).getDate();                                   // 154
        };                                                                                                             // 155
                                                                                                                       // 156
        // `hasWeek` returns `true` if the date resides on a week boundary                                             // 157
        // **????????????????? Don't know if this is true**                                                            // 158
        Date.prototype.hasWeek = function () {                                                                         // 159
            var df = new Date(this.valueOf());                                                                         // 160
            df.setDate(df.getDate() - df.getDay());                                                                    // 161
            var dt = new Date(this.valueOf());                                                                         // 162
            dt.setDate(dt.getDate() + (6 - dt.getDay()));                                                              // 163
                                                                                                                       // 164
            if (df.getMonth() === dt.getMonth()) {                                                                     // 165
                return true;                                                                                           // 166
            } else {                                                                                                   // 167
                return (df.getMonth() === this.getMonth() && dt.getDate() < 4) || (df.getMonth() !== this.getMonth() && dt.getDate() >= 4);
            }                                                                                                          // 169
        };                                                                                                             // 170
                                                                                                                       // 171
        // `getDayForWeek` returns the Date object for the starting date of                                            // 172
        // the week # for the year                                                                                     // 173
        Date.prototype.getDayForWeek = function () {                                                                   // 174
            var df = new Date(this.valueOf());                                                                         // 175
            df.setDate(df.getDate() - df.getDay());                                                                    // 176
            var dt = new Date(this.valueOf());                                                                         // 177
            dt.setDate(dt.getDate() + (6 - dt.getDay()));                                                              // 178
            if ((df.getMonth() === dt.getMonth()) || (df.getMonth() !== dt.getMonth() && dt.getDate() >= 4)) {         // 179
                return new Date(dt.setDate(dt.getDate() - 3));                                                         // 180
            } else {                                                                                                   // 181
                return new Date(df.setDate(df.getDate() + 3));                                                         // 182
            }                                                                                                          // 183
        };                                                                                                             // 184
                                                                                                                       // 185
        // fixes https://github.com/taitems/jQuery.Gantt/issues/62                                                     // 186
        function ktkGetNextDate(currentDate, scaleStep) {                                                              // 187
            for(var minIncrements = 1;; minIncrements++) {                                                             // 188
                var nextDate = new Date(currentDate);                                                                  // 189
                nextDate.setHours(currentDate.getHours() + scaleStep * minIncrements);                                 // 190
                                                                                                                       // 191
                if (nextDate.getTime() !== currentDate.getTime()) {                                                    // 192
                    return nextDate;                                                                                   // 193
                }                                                                                                      // 194
                                                                                                                       // 195
                // If code reaches here, it's because current didn't really increment (invalid local time) because of daylight-saving adjustments
                // => retry adding 2, 3, 4 hours, and so on (until nextDate > current)                                 // 197
            }                                                                                                          // 198
        }                                                                                                              // 199
                                                                                                                       // 200
        // Grid management                                                                                             // 201
        // ===============                                                                                             // 202
                                                                                                                       // 203
        // Core object is responsible for navigation and rendering                                                     // 204
        var core = {                                                                                                   // 205
            // Return the element whose topmost point lies under the given point                                       // 206
            // Normalizes for old browsers                                                                             // 207
            elementFromPoint: (function(){ // IIFE                                                                     // 208
                // version for normal browsers                                                                         // 209
                if (document.compatMode === "CSS1Compat") {                                                            // 210
                    return function (x, y) {                                                                           // 211
                        x -= window.pageXOffset;                                                                       // 212
                        y -= window.pageYOffset;                                                                       // 213
                        return document.elementFromPoint(x, y);                                                        // 214
                    };                                                                                                 // 215
                }                                                                                                      // 216
                // version for older browsers                                                                          // 217
                return function (x, y) {                                                                               // 218
                    x -= $(document).scrollLeft();                                                                     // 219
                    y -= $(document).scrollTop();                                                                      // 220
                    return document.elementFromPoint(x, y);                                                            // 221
                };                                                                                                     // 222
            })(),                                                                                                      // 223
                                                                                                                       // 224
            // **Create the chart**                                                                                    // 225
            create: function (element) {                                                                               // 226
                                                                                                                       // 227
                // Initialize data with a json object or fetch via an xhr                                              // 228
                // request depending on `settings.source`                                                              // 229
                if (typeof settings.source !== "string") {                                                             // 230
                    element.data = settings.source;                                                                    // 231
                    core.init(element);                                                                                // 232
                } else {                                                                                               // 233
                    $.getJSON(settings.source, function (jsData) {                                                     // 234
                        element.data = jsData;                                                                         // 235
                        core.init(element);                                                                            // 236
                    });                                                                                                // 237
                }                                                                                                      // 238
            },                                                                                                         // 239
                                                                                                                       // 240
            // **Setup the initial view**                                                                              // 241
            // Here we calculate the number of rows, pages and visible start                                           // 242
            // and end dates once the data is ready                                                                    // 243
            init: function (element) {                                                                                 // 244
                element.rowsNum = element.data.length;                                                                 // 245
                element.pageCount = Math.ceil(element.rowsNum / settings.itemsPerPage);                                // 246
                element.rowsOnLastPage = element.rowsNum - (Math.floor(element.rowsNum / settings.itemsPerPage) * settings.itemsPerPage);
                                                                                                                       // 248
                element.dateStart = tools.getMinDate(element);                                                         // 249
                element.dateEnd = tools.getMaxDate(element);                                                           // 250
                                                                                                                       // 251
                                                                                                                       // 252
                /* core.render(element); */                                                                            // 253
                core.waitToggle(element, true, function () { core.render(element); });                                 // 254
            },                                                                                                         // 255
                                                                                                                       // 256
            // **Render the grid**                                                                                     // 257
            render: function (element) {                                                                               // 258
                var content = $('<div class="fn-content"/>');                                                          // 259
                var $leftPanel = core.leftPanel(element);                                                              // 260
                content.append($leftPanel);                                                                            // 261
                var $rightPanel = core.rightPanel(element, $leftPanel);                                                // 262
                var mLeft, hPos;                                                                                       // 263
                                                                                                                       // 264
                content.append($rightPanel);                                                                           // 265
                content.append(core.navigation(element));                                                              // 266
                                                                                                                       // 267
                var $dataPanel = $rightPanel.find(".dataPanel");                                                       // 268
                                                                                                                       // 269
                element.gantt = $('<div class="fn-gantt" />').append(content);                                         // 270
                                                                                                                       // 271
                $(element).empty().append(element.gantt);                                                              // 272
                                                                                                                       // 273
                element.scrollNavigation.panelMargin = parseInt($dataPanel.css("margin-left").replace("px", ""), 10);  // 274
                element.scrollNavigation.panelMaxPos = ($dataPanel.width() - $rightPanel.width());                     // 275
                                                                                                                       // 276
                element.scrollNavigation.canScroll = ($dataPanel.width() > $rightPanel.width());                       // 277
                                                                                                                       // 278
                core.markNow(element);                                                                                 // 279
                core.fillData(element, $dataPanel, $leftPanel);                                                        // 280
                                                                                                                       // 281
                // Set a cookie to record current position in the view                                                 // 282
                if (settings.useCookie) {                                                                              // 283
                    var sc = $.cookie(this.cookieKey + "ScrollPos");                                                   // 284
                    if (sc) {                                                                                          // 285
                        element.hPosition = sc;                                                                        // 286
                    }                                                                                                  // 287
                }                                                                                                      // 288
                                                                                                                       // 289
                // Scroll the grid to today's date                                                                     // 290
                if (settings.scrollToToday) {                                                                          // 291
                    core.navigateTo(element, 'now');                                                                   // 292
                    core.scrollPanel(element, 0);                                                                      // 293
                // or, scroll the grid to the left most date in the panel                                              // 294
                } else {                                                                                               // 295
                    if ((element.hPosition !== 0)) {                                                                   // 296
                        if (element.scaleOldWidth) {                                                                   // 297
                            mLeft = ($dataPanel.width() - $rightPanel.width());                                        // 298
                            hPos = mLeft * element.hPosition / element.scaleOldWidth;                                  // 299
                            hPos = hPos > 0 ? 0 : hPos;                                                                // 300
                            $dataPanel.css({ "margin-left": hPos + "px" });                                            // 301
                            element.scrollNavigation.panelMargin = hPos;                                               // 302
                            element.hPosition = hPos;                                                                  // 303
                            element.scaleOldWidth = null;                                                              // 304
                        } else {                                                                                       // 305
                            $dataPanel.css({ "margin-left": element.hPosition + "px" });                               // 306
                            element.scrollNavigation.panelMargin = element.hPosition;                                  // 307
                        }                                                                                              // 308
                        core.repositionLabel(element);                                                                 // 309
                    } else {                                                                                           // 310
                        core.repositionLabel(element);                                                                 // 311
                    }                                                                                                  // 312
                }                                                                                                      // 313
                                                                                                                       // 314
                $dataPanel.css({ height: $leftPanel.height() });                                                       // 315
                core.waitToggle(element, false);                                                                       // 316
                settings.onRender();                                                                                   // 317
            },                                                                                                         // 318
                                                                                                                       // 319
            // Create and return the left panel with labels                                                            // 320
            leftPanel: function (element) {                                                                            // 321
                /* Left panel */                                                                                       // 322
                var ganttLeftPanel = $('<div class="leftPanel"/>')                                                     // 323
                    .append($('<div class="row spacer"/>')                                                             // 324
                    .css("height", tools.getCellSize() * element.headerRows + "px")                                    // 325
                    .css("width", "100%"));                                                                            // 326
                                                                                                                       // 327
                var entries = [];                                                                                      // 328
                $.each(element.data, function (i, entry) {                                                             // 329
                    if (i >= element.pageNum * settings.itemsPerPage && i < (element.pageNum * settings.itemsPerPage + settings.itemsPerPage)) {
                        entries.push('<div class="row name row' + i + (entry.desc ? '' : ' fn-wide') + '" id="rowheader' + i + '" offset="' + i % settings.itemsPerPage * tools.getCellSize() + '">');
                        entries.push('<span class="fn-label' + (entry.cssClass ? ' ' + entry.cssClass : '') + '">' + entry.name + '</span>');
                        entries.push('</div>');                                                                        // 333
                                                                                                                       // 334
                        if (entry.desc) {                                                                              // 335
                            entries.push('<div class="row desc row' + i + ' " id="RowdId_' + i + '" data-id="' + entry.id + '">');
                            entries.push('<span class="fn-label' + (entry.cssClass ? ' ' + entry.cssClass : '') + '">' + entry.desc + '</span>');
                            entries.push('</div>');                                                                    // 338
                        }                                                                                              // 339
                                                                                                                       // 340
                    }                                                                                                  // 341
                });                                                                                                    // 342
                ganttLeftPanel.append(entries.join(""));                                                               // 343
                return ganttLeftPanel;                                                                                 // 344
            },                                                                                                         // 345
                                                                                                                       // 346
            // Create and return the data panel element                                                                // 347
            dataPanel: function (element, width) {                                                                     // 348
                var dataPanel = $('<div class="dataPanel" style="width: ' + width + 'px;"/>');                         // 349
                                                                                                                       // 350
                // Handle mousewheel events for scrolling the data panel                                               // 351
                var wheel = 'onwheel' in element ? 'wheel' : document.onmousewheel !== undefined ? 'mousewheel' : 'DOMMouseScroll';
                $(element).on(wheel, function (e) { core.wheelScroll(element, e); });                                  // 353
                                                                                                                       // 354
                // Handle click events and dispatch to registered `onAddClick`                                         // 355
                // function                                                                                            // 356
                dataPanel.click(function (e) {                                                                         // 357
                                                                                                                       // 358
                    e.stopPropagation();                                                                               // 359
                    var corrX/* <- never used? */, corrY;                                                              // 360
                    var leftpanel = $(element).find(".fn-gantt .leftPanel");                                           // 361
                    var datapanel = $(element).find(".fn-gantt .dataPanel");                                           // 362
                    switch (settings.scale) {                                                                          // 363
                        case "weeks":                                                                                  // 364
                            corrY = tools.getCellSize() * 2;                                                           // 365
                            break;                                                                                     // 366
                        case "months":                                                                                 // 367
                            corrY = tools.getCellSize();                                                               // 368
                            break;                                                                                     // 369
                        case "hours":                                                                                  // 370
                            corrY = tools.getCellSize() * 4;                                                           // 371
                            break;                                                                                     // 372
                        case "days":                                                                                   // 373
                            corrY = tools.getCellSize() * 3;                                                           // 374
                            break;                                                                                     // 375
                        default:                                                                                       // 376
                            corrY = tools.getCellSize() * 2;                                                           // 377
                            break;                                                                                     // 378
                    }                                                                                                  // 379
                                                                                                                       // 380
                    /* Adjust, so get middle of elm                                                                    // 381
                    corrY -= Math.floor(tools.getCellSize() / 2);                                                      // 382
                    */                                                                                                 // 383
                                                                                                                       // 384
                    // Find column where click occurred                                                                // 385
                    var col = core.elementFromPoint(e.pageX, datapanel.offset().top + corrY);                          // 386
                    // Was the label clicked directly?                                                                 // 387
                    if (col.className === "fn-label") {                                                                // 388
                        col = $(col.parentNode);                                                                       // 389
                    } else {                                                                                           // 390
                        col = $(col);                                                                                  // 391
                    }                                                                                                  // 392
                                                                                                                       // 393
                    var dt = col.attr("repdate");                                                                      // 394
                    // Find row where click occurred                                                                   // 395
                    var row = core.elementFromPoint(leftpanel.offset().left + leftpanel.width() - 10, e.pageY);        // 396
                    // Was the lable clicked directly?                                                                 // 397
                    if (row.className.indexOf("fn-label") === 0) {                                                     // 398
                        row = $(row.parentNode);                                                                       // 399
                    } else {                                                                                           // 400
                        row = $(row);                                                                                  // 401
                    }                                                                                                  // 402
                    var rowId = row.data().id;                                                                         // 403
                                                                                                                       // 404
                    // Dispatch user registered function with the DateTime in ms                                       // 405
                    // and the id if the clicked object is a row                                                       // 406
                    settings.onAddClick(dt, rowId);                                                                    // 407
                });                                                                                                    // 408
                return dataPanel;                                                                                      // 409
            },                                                                                                         // 410
                                                                                                                       // 411
            // Creates and return the right panel containing the year/week/day                                         // 412
            // header                                                                                                  // 413
            rightPanel: function (element, leftPanel /* <- never used? */) {                                           // 414
                                                                                                                       // 415
                var range = null;                                                                                      // 416
                // Days of the week have a class of one of                                                             // 417
                // `sn` (Sunday), `sa` (Saturday), or `wd` (Weekday)                                                   // 418
                var dowClass = ["sn", "wd", "wd", "wd", "wd", "wd", "sa"];                                             // 419
                //TODO: was someone planning to allow styles to stretch to the bottom of the chart?                    // 420
                //var gridDowClass = [" sn", "", "", "", "", "", " sa"];                                               // 421
                                                                                                                       // 422
                var yearArr = ['<div class="row"/>'];                                                                  // 423
                var daysInYear = 0;                                                                                    // 424
                                                                                                                       // 425
                var monthArr = ['<div class="row"/>'];                                                                 // 426
                var daysInMonth = 0;                                                                                   // 427
                                                                                                                       // 428
                var dayArr = [];                                                                                       // 429
                                                                                                                       // 430
                var hoursInDay = 0;                                                                                    // 431
                                                                                                                       // 432
                var dowArr = [];                                                                                       // 433
                                                                                                                       // 434
                var horArr = [];                                                                                       // 435
                                                                                                                       // 436
                                                                                                                       // 437
                var today = new Date();                                                                                // 438
                today = new Date(today.getFullYear(), today.getMonth(), today.getDate());                              // 439
                                                                                                                       // 440
                // Setup the headings based on the chosen `settings.scale`                                             // 441
                switch (settings.scale) {                                                                              // 442
                    // **Hours**                                                                                       // 443
                    case "hours":                                                                                      // 444
                                                                                                                       // 445
                        range = tools.parseTimeRange(element.dateStart, element.dateEnd, element.scaleStep);           // 446
                                                                                                                       // 447
                        var year = range[0].getFullYear();                                                             // 448
                        var month = range[0].getMonth();                                                               // 449
                        var day = range[0];                                                                            // 450
                                                                                                                       // 451
                        for (var i = 0, len = range.length; i < len; i++) {                                            // 452
                            var rday = range[i];                                                                       // 453
                                                                                                                       // 454
                            // Fill years                                                                              // 455
                            var rfy = rday.getFullYear();                                                              // 456
                            if (rfy !== year) {                                                                        // 457
                                yearArr.push(                                                                          // 458
                                    ('<div class="row header year" style="width: '                                     // 459
                                        + tools.getCellSize() * daysInYear                                             // 460
                                        + 'px;"><div class="fn-label">'                                                // 461
                                        + year                                                                         // 462
                                        + '</div></div>'));                                                            // 463
                                                                                                                       // 464
                                year = rfy;                                                                            // 465
                                daysInYear = 0;                                                                        // 466
                            }                                                                                          // 467
                            daysInYear++;                                                                              // 468
                                                                                                                       // 469
                                                                                                                       // 470
                            // Fill months                                                                             // 471
                            var rm = rday.getMonth();                                                                  // 472
                            if (rm !== month) {                                                                        // 473
                                monthArr.push(                                                                         // 474
                                    ('<div class="row header month" style="width: '                                    // 475
                                    + tools.getCellSize() * daysInMonth + 'px"><div class="fn-label">'                 // 476
                                    + settings.months[month]                                                           // 477
                                    + '</div></div>'));                                                                // 478
                                                                                                                       // 479
                                month = rm;                                                                            // 480
                                daysInMonth = 0;                                                                       // 481
                            }                                                                                          // 482
                            daysInMonth++;                                                                             // 483
                                                                                                                       // 484
                                                                                                                       // 485
                            // Fill days & hours                                                                       // 486
                                                                                                                       // 487
                            var rgetDay = rday.getDay();                                                               // 488
                            var getDay = day.getDay();                                                                 // 489
                            var day_class = dowClass[rgetDay];                                                         // 490
                            if (tools.isHoliday(rday)) {                                                               // 491
                                day_class = "holiday";                                                                 // 492
                            }                                                                                          // 493
                            if (rgetDay !== getDay) {                                                                  // 494
                                var day_class2 = (today - day === 0) ? "today" : tools.isHoliday( day.getTime() ) ? "holiday" : dowClass[getDay];
                                                                                                                       // 496
                                dayArr.push('<div class="row date ' + day_class2 + '" '                                // 497
                                        + ' style="width: ' + tools.getCellSize() * hoursInDay + 'px;"> '              // 498
                                        + ' <div class="fn-label">' + day.getDate() + '</div></div>');                 // 499
                                dowArr.push('<div class="row day ' + day_class2 + '" '                                 // 500
                                        + ' style="width: ' + tools.getCellSize() * hoursInDay + 'px;"> '              // 501
                                        + ' <div class="fn-label">' + settings.dow[getDay] + '</div></div>');          // 502
                                                                                                                       // 503
                                day = rday;                                                                            // 504
                                hoursInDay = 0;                                                                        // 505
                            }                                                                                          // 506
                            hoursInDay++;                                                                              // 507
                                                                                                                       // 508
                            horArr.push('<div class="row day '                                                         // 509
                                    + day_class                                                                        // 510
                                    + '" id="dh-'                                                                      // 511
                                    + rday.getTime()                                                                   // 512
                                    + '"  offset="' + i * tools.getCellSize() + '" repdate="' + rday.getRepDate() + '"><div class="fn-label">'
                                    + rday.getHours()                                                                  // 514
                                    + '</div></div>');                                                                 // 515
                        }                                                                                              // 516
                                                                                                                       // 517
                                                                                                                       // 518
                        // Last year                                                                                   // 519
                        yearArr.push(                                                                                  // 520
                            '<div class="row header year" style="width: '                                              // 521
                            + tools.getCellSize() * daysInYear + 'px;"><div class="fn-label">'                         // 522
                            + year                                                                                     // 523
                            + '</div></div>');                                                                         // 524
                                                                                                                       // 525
                        // Last month                                                                                  // 526
                        monthArr.push(                                                                                 // 527
                            '<div class="row header month" style="width: '                                             // 528
                            + tools.getCellSize() * daysInMonth + 'px"><div class="fn-label">'                         // 529
                            + settings.months[month]                                                                   // 530
                            + '</div></div>');                                                                         // 531
                                                                                                                       // 532
                        var day_class = dowClass[day.getDay()];                                                        // 533
                                                                                                                       // 534
                        if ( tools.isHoliday(day) ) {                                                                  // 535
                            day_class = "holiday";                                                                     // 536
                        }                                                                                              // 537
                                                                                                                       // 538
                        dayArr.push('<div class="row date ' + day_class + '" '                                         // 539
                                + ' style="width: ' + tools.getCellSize() * hoursInDay + 'px;"> '                      // 540
                                + ' <div class="fn-label">' + day.getDate() + '</div></div>');                         // 541
                                                                                                                       // 542
                        dowArr.push('<div class="row day ' + day_class + '" '                                          // 543
                                + ' style="width: ' + tools.getCellSize() * hoursInDay + 'px;"> '                      // 544
                                + ' <div class="fn-label">' + settings.dow[day.getDay()] + '</div></div>');            // 545
                                                                                                                       // 546
                        var dataPanel = core.dataPanel(element, range.length * tools.getCellSize());                   // 547
                                                                                                                       // 548
                                                                                                                       // 549
                        // Append panel elements                                                                       // 550
                        dataPanel.append(yearArr.join(""));                                                            // 551
                        dataPanel.append(monthArr.join(""));                                                           // 552
                        dataPanel.append($('<div class="row"/>').html(dayArr.join("")));                               // 553
                        dataPanel.append($('<div class="row"/>').html(dowArr.join("")));                               // 554
                        dataPanel.append($('<div class="row"/>').html(horArr.join("")));                               // 555
                                                                                                                       // 556
                        break;                                                                                         // 557
                                                                                                                       // 558
                    // **Weeks**                                                                                       // 559
                    case "weeks":                                                                                      // 560
                        range = tools.parseWeeksRange(element.dateStart, element.dateEnd);                             // 561
                        yearArr = ['<div class="row"/>'];                                                              // 562
                        monthArr = ['<div class="row"/>'];                                                             // 563
                        var year = range[0].getFullYear();                                                             // 564
                        var month = range[0].getMonth();                                                               // 565
                        var day = range[0];                                                                            // 566
                                                                                                                       // 567
                        for (var i = 0, len = range.length; i < len; i++) {                                            // 568
                            var rday = range[i];                                                                       // 569
                                                                                                                       // 570
                            // Fill years                                                                              // 571
                            if (rday.getFullYear() !== year) {                                                         // 572
                                yearArr.push(                                                                          // 573
                                    ('<div class="row header year" style="width: '                                     // 574
                                        + tools.getCellSize() * daysInYear                                             // 575
                                        + 'px;"><div class="fn-label">'                                                // 576
                                        + year                                                                         // 577
                                        + '</div></div>'));                                                            // 578
                                year = rday.getFullYear();                                                             // 579
                                daysInYear = 0;                                                                        // 580
                            }                                                                                          // 581
                            daysInYear++;                                                                              // 582
                                                                                                                       // 583
                            // Fill months                                                                             // 584
                            if (rday.getMonth() !== month) {                                                           // 585
                                monthArr.push(                                                                         // 586
                                    ('<div class="row header month" style="width:'                                     // 587
                                       + tools.getCellSize() * daysInMonth                                             // 588
                                       + 'px;"><div class="fn-label">'                                                 // 589
                                       + settings.months[month]                                                        // 590
                                       + '</div></div>'));                                                             // 591
                                month = rday.getMonth();                                                               // 592
                                daysInMonth = 0;                                                                       // 593
                            }                                                                                          // 594
                            daysInMonth++;                                                                             // 595
                                                                                                                       // 596
                            // Fill weeks                                                                              // 597
                            dayArr.push('<div class="row day wd" '                                                     // 598
                                    + ' id="' + rday.getWeekId() + '" offset="' + i * tools.getCellSize() + '" repdate="' + rday.getRepDate() + '"> '
                                    + ' <div class="fn-label">' + rday.getWeekOfYear() + '</div></div>');              // 600
                        }                                                                                              // 601
                                                                                                                       // 602
                                                                                                                       // 603
                        // Last year                                                                                   // 604
                        yearArr.push(                                                                                  // 605
                            '<div class="row header year" style="width: '                                              // 606
                            + tools.getCellSize() * daysInYear + 'px;"><div class="fn-label">'                         // 607
                            + year                                                                                     // 608
                            + '</div></div>');                                                                         // 609
                                                                                                                       // 610
                        // Last month                                                                                  // 611
                        monthArr.push(                                                                                 // 612
                            '<div class="row header month" style="width: '                                             // 613
                            + tools.getCellSize() * daysInMonth + 'px"><div class="fn-label">'                         // 614
                            + settings.months[month]                                                                   // 615
                            + '</div></div>');                                                                         // 616
                                                                                                                       // 617
                        var dataPanel = core.dataPanel(element, range.length * tools.getCellSize());                   // 618
                                                                                                                       // 619
                        dataPanel.append(yearArr.join("") + monthArr.join("") + dayArr.join("") + (dowArr.join("")));  // 620
                                                                                                                       // 621
                        break;                                                                                         // 622
                                                                                                                       // 623
                    // **Months**                                                                                      // 624
                    case 'months':                                                                                     // 625
                        range = tools.parseMonthsRange(element.dateStart, element.dateEnd);                            // 626
                                                                                                                       // 627
                        var year = range[0].getFullYear();                                                             // 628
                        var month = range[0].getMonth();                                                               // 629
                        var day = range[0];                                                                            // 630
                                                                                                                       // 631
                        for (var i = 0, len = range.length; i < len; i++) {                                            // 632
                            var rday = range[i];                                                                       // 633
                                                                                                                       // 634
                            // Fill years                                                                              // 635
                            if (rday.getFullYear() !== year) {                                                         // 636
                                yearArr.push(                                                                          // 637
                                    ('<div class="row header year" style="width: '                                     // 638
                                        + tools.getCellSize() * daysInYear                                             // 639
                                        + 'px;"><div class="fn-label">'                                                // 640
                                        + year                                                                         // 641
                                        + '</div></div>'));                                                            // 642
                                year = rday.getFullYear();                                                             // 643
                                daysInYear = 0;                                                                        // 644
                            }                                                                                          // 645
                            daysInYear++;                                                                              // 646
                            monthArr.push('<div class="row day wd" id="dh-' + tools.genId(rday.getTime()) + '" offset="' + i * tools.getCellSize() + '" repdate="' + rday.getRepDate() + '">' + (1 + rday.getMonth()) + '</div>');
                        }                                                                                              // 648
                                                                                                                       // 649
                                                                                                                       // 650
                        // Last year                                                                                   // 651
                        yearArr.push(                                                                                  // 652
                            '<div class="row header year" style="width: '                                              // 653
                            + tools.getCellSize() * daysInYear + 'px;"><div class="fn-label">'                         // 654
                            + year                                                                                     // 655
                            + '</div></div>');                                                                         // 656
                                                                                                                       // 657
                        // Last month                                                                                  // 658
                        monthArr.push(                                                                                 // 659
                            '<div class="row header month" style="width: '                                             // 660
                            + tools.getCellSize() * daysInMonth + 'px"><div class="fn-label">'                         // 661
                            + settings.months[month]                                                                   // 662
                            + '</div></div>');                                                                         // 663
                                                                                                                       // 664
                        var dataPanel = core.dataPanel(element, range.length * tools.getCellSize());                   // 665
                                                                                                                       // 666
                        // Append panel elements                                                                       // 667
                        dataPanel.append(yearArr.join(""));                                                            // 668
                        dataPanel.append(monthArr.join(""));                                                           // 669
                        dataPanel.append($('<div class="row"/>').html(dayArr.join("")));                               // 670
                        dataPanel.append($('<div class="row"/>').html(dowArr.join("")));                               // 671
                                                                                                                       // 672
                        break;                                                                                         // 673
                                                                                                                       // 674
                    // **Days (default)**                                                                              // 675
                    default:                                                                                           // 676
                        range = tools.parseDateRange(element.dateStart, element.dateEnd);                              // 677
                                                                                                                       // 678
                        var dateBefore = ktkGetNextDate(range[0], -1);                                                 // 679
                        var year = dateBefore.getFullYear();                                                           // 680
                        var month = dateBefore.getMonth();                                                             // 681
                        var day = dateBefore; // <- never used?                                                        // 682
                                                                                                                       // 683
                        for (var i = 0, len = range.length; i < len; i++) {                                            // 684
                            var rday = range[i];                                                                       // 685
                                                                                                                       // 686
                            // Fill years                                                                              // 687
                            if (rday.getFullYear() !== year) {                                                         // 688
                                yearArr.push(                                                                          // 689
                                    ('<div class="row header year" style="width:'                                      // 690
                                        + tools.getCellSize() * daysInYear                                             // 691
                                        + 'px;"><div class="fn-label">'                                                // 692
                                        + year                                                                         // 693
                                        + '</div></div>'));                                                            // 694
                                year = rday.getFullYear();                                                             // 695
                                daysInYear = 0;                                                                        // 696
                            }                                                                                          // 697
                            daysInYear++;                                                                              // 698
                                                                                                                       // 699
                            // Fill months                                                                             // 700
                            if (rday.getMonth() !== month) {                                                           // 701
                                monthArr.push(                                                                         // 702
                                    ('<div class="row header month" style="width:'                                     // 703
                                       + tools.getCellSize() * daysInMonth                                             // 704
                                       + 'px;"><div class="fn-label">'                                                 // 705
                                       + settings.months[month]                                                        // 706
                                       + '</div></div>'));                                                             // 707
                                month = rday.getMonth();                                                               // 708
                                daysInMonth = 0;                                                                       // 709
                            }                                                                                          // 710
                            daysInMonth++;                                                                             // 711
                                                                                                                       // 712
                            var getDay = rday.getDay();                                                                // 713
                            var day_class = dowClass[getDay];                                                          // 714
                            if ( tools.isHoliday(rday) ) {                                                             // 715
                                day_class = "holiday";                                                                 // 716
                            }                                                                                          // 717
                                                                                                                       // 718
                            dayArr.push('<div class="row date ' + day_class + '" '                                     // 719
                                    + ' id="dh-' + tools.genId(rday.getTime()) + '" offset="' + i * tools.getCellSize() + '" repdate="' + rday.getRepDate() + '"> '
                                    + ' <div class="fn-label">' + rday.getDate() + '</div></div>');                    // 721
                            dowArr.push('<div class="row day ' + day_class + '" '                                      // 722
                                    + ' id="dw-' + tools.genId(rday.getTime()) + '"  repdate="' + rday.getRepDate() + '"> '
                                    + ' <div class="fn-label">' + settings.dow[getDay] + '</div></div>');              // 724
                        } //for                                                                                        // 725
                                                                                                                       // 726
                        // Last year                                                                                   // 727
                        yearArr.push(                                                                                  // 728
                            '<div class="row header year" style="width: '                                              // 729
                            + tools.getCellSize() * daysInYear + 'px;"><div class="fn-label">'                         // 730
                            + year                                                                                     // 731
                            + '</div></div>');                                                                         // 732
                                                                                                                       // 733
                        // Last month                                                                                  // 734
                        monthArr.push(                                                                                 // 735
                            '<div class="row header month" style="width: '                                             // 736
                            + tools.getCellSize() * daysInMonth + 'px"><div class="fn-label">'                         // 737
                            + settings.months[month]                                                                   // 738
                            + '</div></div>');                                                                         // 739
                                                                                                                       // 740
                        var dataPanel = core.dataPanel(element, range.length * tools.getCellSize());                   // 741
                                                                                                                       // 742
                                                                                                                       // 743
                        // Append panel elements                                                                       // 744
                                                                                                                       // 745
                        dataPanel.append(yearArr.join(""));                                                            // 746
                        dataPanel.append(monthArr.join(""));                                                           // 747
                        dataPanel.append($('<div class="row" style="margin-left: 0;" />').html(dayArr.join("")));      // 748
                        dataPanel.append($('<div class="row" style="margin-left: 0;" />').html(dowArr.join("")));      // 749
                                                                                                                       // 750
                        break;                                                                                         // 751
                }                                                                                                      // 752
                                                                                                                       // 753
                return $('<div class="rightPanel"></div>').append(dataPanel);                                          // 754
            },                                                                                                         // 755
                                                                                                                       // 756
            // **Navigation**                                                                                          // 757
            navigation: function (element) {                                                                           // 758
                var ganttNavigate = null;                                                                              // 759
                // Scrolling navigation is provided by setting                                                         // 760
                // `settings.navigate='scroll'`                                                                        // 761
                if (settings.navigate === "scroll") {                                                                  // 762
                    ganttNavigate = $('<div class="navigate" />')                                                      // 763
                        .append($('<div class="nav-slider" />')                                                        // 764
                            .append($('<div class="nav-slider-left" />')                                               // 765
                                .append($('<button type="button" class="nav-link nav-page-back"/>')                    // 766
                                    .html('&lt;')                                                                      // 767
                                    .click(function () {                                                               // 768
                                        core.navigatePage(element, -1);                                                // 769
                                    }))                                                                                // 770
                                .append($('<div class="page-number"/>')                                                // 771
                                        .append($('<span/>')                                                           // 772
                                            .html(element.pageNum + 1 + ' of ' + element.pageCount)))                  // 773
                                .append($('<button type="button" class="nav-link nav-page-next"/>')                    // 774
                                    .html('&gt;')                                                                      // 775
                                    .click(function () {                                                               // 776
                                        core.navigatePage(element, 1);                                                 // 777
                                    }))                                                                                // 778
                                .append($('<button type="button" class="nav-link nav-now"/>')                          // 779
                                    .html('&#9679;')                                                                   // 780
                                    .click(function () {                                                               // 781
                                        core.navigateTo(element, 'now');                                               // 782
                                    }))                                                                                // 783
                                .append($('<button type="button" class="nav-link nav-prev-week"/>')                    // 784
                                    .html('&lt;&lt;')                                                                  // 785
                                    .click(function () {                                                               // 786
                                        if (settings.scale === 'hours') {                                              // 787
                                            core.navigateTo(element, tools.getCellSize() * 8);                         // 788
                                        } else if (settings.scale === 'days') {                                        // 789
                                            core.navigateTo(element, tools.getCellSize() * 30);                        // 790
                                        } else if (settings.scale === 'weeks') {                                       // 791
                                            core.navigateTo(element, tools.getCellSize() * 12);                        // 792
                                        } else if (settings.scale === 'months') {                                      // 793
                                            core.navigateTo(element, tools.getCellSize() * 6);                         // 794
                                        }                                                                              // 795
                                    }))                                                                                // 796
                                .append($('<button type="button" class="nav-link nav-prev-day"/>')                     // 797
                                    .html('&lt;')                                                                      // 798
                                    .click(function () {                                                               // 799
                                        if (settings.scale === 'hours') {                                              // 800
                                            core.navigateTo(element, tools.getCellSize() * 4);                         // 801
                                        } else if (settings.scale === 'days') {                                        // 802
                                            core.navigateTo(element, tools.getCellSize() * 7);                         // 803
                                        } else if (settings.scale === 'weeks') {                                       // 804
                                            core.navigateTo(element, tools.getCellSize() * 4);                         // 805
                                        } else if (settings.scale === 'months') {                                      // 806
                                            core.navigateTo(element, tools.getCellSize() * 3);                         // 807
                                        }                                                                              // 808
                                    })))                                                                               // 809
                            .append($('<div class="nav-slider-content" />')                                            // 810
                                    .append($('<div class="nav-slider-bar" />')                                        // 811
                                            .append($('<a class="nav-slider-button" />')                               // 812
                                                )                                                                      // 813
                                                .mousedown(function (e) {                                              // 814
                                                    e.preventDefault();                                                // 815
                                                    element.scrollNavigation.scrollerMouseDown = true;                 // 816
                                                    core.sliderScroll(element, e);                                     // 817
                                                })                                                                     // 818
                                                .mousemove(function (e) {                                              // 819
                                                    if (element.scrollNavigation.scrollerMouseDown) {                  // 820
                                                        core.sliderScroll(element, e);                                 // 821
                                                    }                                                                  // 822
                                                })                                                                     // 823
                                            )                                                                          // 824
                                        )                                                                              // 825
                            .append($('<div class="nav-slider-right" />')                                              // 826
                                .append($('<button type="button" class="nav-link nav-next-day"/>')                     // 827
                                    .html('&gt;')                                                                      // 828
                                    .click(function () {                                                               // 829
                                        if (settings.scale === 'hours') {                                              // 830
                                            core.navigateTo(element, tools.getCellSize() * -4);                        // 831
                                        } else if (settings.scale === 'days') {                                        // 832
                                            core.navigateTo(element, tools.getCellSize() * -7);                        // 833
                                        } else if (settings.scale === 'weeks') {                                       // 834
                                            core.navigateTo(element, tools.getCellSize() * -4);                        // 835
                                        } else if (settings.scale === 'months') {                                      // 836
                                            core.navigateTo(element, tools.getCellSize() * -3);                        // 837
                                        }                                                                              // 838
                                    }))                                                                                // 839
                            .append($('<button type="button" class="nav-link nav-next-week"/>')                        // 840
                                    .html('&gt;&gt;')                                                                  // 841
                                    .click(function () {                                                               // 842
                                        if (settings.scale === 'hours') {                                              // 843
                                            core.navigateTo(element, tools.getCellSize() * -8);                        // 844
                                        } else if (settings.scale === 'days') {                                        // 845
                                            core.navigateTo(element, tools.getCellSize() * -30);                       // 846
                                        } else if (settings.scale === 'weeks') {                                       // 847
                                            core.navigateTo(element, tools.getCellSize() * -12);                       // 848
                                        } else if (settings.scale === 'months') {                                      // 849
                                            core.navigateTo(element, tools.getCellSize() * -6);                        // 850
                                        }                                                                              // 851
                                    }))                                                                                // 852
                                .append($('<button type="button" class="nav-link nav-zoomIn"/>')                       // 853
                                    .html('&#43;')                                                                     // 854
                                    .click(function () {                                                               // 855
                                        core.zoomInOut(element, -1);                                                   // 856
                                    }))                                                                                // 857
                                .append($('<button type="button" class="nav-link nav-zoomOut"/>')                      // 858
                                    .html('&#45;')                                                                     // 859
                                    .click(function () {                                                               // 860
                                        core.zoomInOut(element, 1);                                                    // 861
                                    }))                                                                                // 862
                                    )                                                                                  // 863
                                );                                                                                     // 864
                    $(document).mouseup(function () {                                                                  // 865
                        element.scrollNavigation.scrollerMouseDown = false;                                            // 866
                    });                                                                                                // 867
                // Button navigation is provided by setting `settings.navigation='buttons'`                            // 868
                } else {                                                                                               // 869
                    ganttNavigate = $('<div class="navigate" />')                                                      // 870
                        .append($('<button type="button" class="nav-link nav-page-back"/>')                            // 871
                            .html('&lt;')                                                                              // 872
                            .click(function () {                                                                       // 873
                                core.navigatePage(element, -1);                                                        // 874
                            }))                                                                                        // 875
                        .append($('<div class="page-number"/>')                                                        // 876
                                .append($('<span/>')                                                                   // 877
                                    .html(element.pageNum + 1 + ' of ' + element.pageCount)))                          // 878
                        .append($('<button type="button" class="nav-link nav-page-next"/>')                            // 879
                            .html('&gt;')                                                                              // 880
                            .click(function () {                                                                       // 881
                                core.navigatePage(element, 1);                                                         // 882
                            }))                                                                                        // 883
                        .append($('<button type="button" class="nav-link nav-begin"/>')                                // 884
                            .html('&#124;&lt;')                                                                        // 885
                            .click(function () {                                                                       // 886
                                core.navigateTo(element, 'begin');                                                     // 887
                            }))                                                                                        // 888
                        .append($('<button type="button" class="nav-link nav-prev-week"/>')                            // 889
                            .html('&lt;&lt;')                                                                          // 890
                            .click(function () {                                                                       // 891
                                core.navigateTo(element, tools.getCellSize() * 7);                                     // 892
                            }))                                                                                        // 893
                        .append($('<button type="button" class="nav-link nav-prev-day"/>')                             // 894
                            .html('&lt;')                                                                              // 895
                            .click(function () {                                                                       // 896
                                core.navigateTo(element, tools.getCellSize());                                         // 897
                            }))                                                                                        // 898
                        .append($('<button type="button" class="nav-link nav-now"/>')                                  // 899
                            .html('&#9679;')                                                                           // 900
                            .click(function () {                                                                       // 901
                                core.navigateTo(element, 'now');                                                       // 902
                            }))                                                                                        // 903
                        .append($('<button type="button" class="nav-link nav-next-day"/>')                             // 904
                            .html('&gt;')                                                                              // 905
                            .click(function () {                                                                       // 906
                                core.navigateTo(element, tools.getCellSize() * -1);                                    // 907
                            }))                                                                                        // 908
                        .append($('<button type="button" class="nav-link nav-next-week"/>')                            // 909
                            .html('&gt;&gt;')                                                                          // 910
                            .click(function () {                                                                       // 911
                                core.navigateTo(element, tools.getCellSize() * -7);                                    // 912
                            }))                                                                                        // 913
                        .append($('<button type="button" class="nav-link nav-end"/>')                                  // 914
                            .html('&gt;&#124;')                                                                        // 915
                            .click(function () {                                                                       // 916
                                core.navigateTo(element, 'end');                                                       // 917
                            }))                                                                                        // 918
                        .append($('<button type="button" class="nav-link nav-zoomIn"/>')                               // 919
                            .html('&#43;')                                                                             // 920
                            .click(function () {                                                                       // 921
                                core.zoomInOut(element, -1);                                                           // 922
                            }))                                                                                        // 923
                        .append($('<button type="button" class="nav-link nav-zoomOut"/>')                              // 924
                            .html('&#45;')                                                                             // 925
                            .click(function () {                                                                       // 926
                                core.zoomInOut(element, 1);                                                            // 927
                            }));                                                                                       // 928
                }                                                                                                      // 929
                return $('<div class="bottom"/>').append(ganttNavigate);                                               // 930
            },                                                                                                         // 931
                                                                                                                       // 932
            // **Progress Bar**                                                                                        // 933
            // Return an element representing a progress of position within                                            // 934
            // the entire chart                                                                                        // 935
            createProgressBar: function (days, cls, desc, label, dataObj) {                                            // 936
                var cellWidth = tools.getCellSize();                                                                   // 937
                var barMarg = tools.getProgressBarMargin() || 0;                                                       // 938
                var bar = $('<div class="bar"><div class="fn-label">' + label + '</div></div>')                        // 939
                        .addClass(cls)                                                                                 // 940
                        .css({                                                                                         // 941
                            width: ((cellWidth * days) - barMarg) + 2                                                  // 942
                        })                                                                                             // 943
                        .data("dataObj", dataObj);                                                                     // 944
                                                                                                                       // 945
                if (desc) {                                                                                            // 946
                    bar                                                                                                // 947
                      .mouseover(function (e) {                                                                        // 948
                          var hint = $('<div class="fn-gantt-hint" />').html(desc);                                    // 949
                          $("body").append(hint);                                                                      // 950
                          hint.css("left", e.pageX);                                                                   // 951
                          hint.css("top", e.pageY);                                                                    // 952
                          hint.show();                                                                                 // 953
                      })                                                                                               // 954
                      .mouseout(function () {                                                                          // 955
                          $(".fn-gantt-hint").remove();                                                                // 956
                      })                                                                                               // 957
                      .mousemove(function (e) {                                                                        // 958
                          $(".fn-gantt-hint").css("left", e.pageX);                                                    // 959
                          $(".fn-gantt-hint").css("top", e.pageY + 15);                                                // 960
                      });                                                                                              // 961
                }                                                                                                      // 962
                bar.click(function (e) {                                                                               // 963
                    e.stopPropagation();                                                                               // 964
                    settings.onItemClick($(this).data("dataObj"));                                                     // 965
                });                                                                                                    // 966
                return bar;                                                                                            // 967
            },                                                                                                         // 968
                                                                                                                       // 969
            // Remove the `wd` (weekday) class and add `today` class to the                                            // 970
            // current day/week/month (depending on the current scale)                                                 // 971
            markNow: function (element) {                                                                              // 972
                switch (settings.scale) {                                                                              // 973
                    case "weeks":                                                                                      // 974
                        var cd = Date.parse(new Date());                                                               // 975
                        cd = (Math.floor(cd / 36400000) * 36400000);                                                   // 976
                        $(element).find(':findweek("' + cd + '")').removeClass('wd').addClass('today');                // 977
                        break;                                                                                         // 978
                    case "months":                                                                                     // 979
                        $(element).find(':findmonth("' + new Date().getTime() + '")').removeClass('wd').addClass('today');
                        break;                                                                                         // 981
                    default:                                                                                           // 982
                        var cd = Date.parse(new Date());                                                               // 983
                        cd = (Math.floor(cd / 36400000) * 36400000);                                                   // 984
                        $(element).find(':findday("' + cd + '")').removeClass('wd').addClass('today');                 // 985
                        break;                                                                                         // 986
                }                                                                                                      // 987
            },                                                                                                         // 988
                                                                                                                       // 989
            // **Fill the Chart**                                                                                      // 990
            // Parse the data and fill the data panel                                                                  // 991
            fillData: function (element, datapanel, leftpanel /* <- never used? */) {                                  // 992
                var invertColor = function (colStr) {                                                                  // 993
                    try {                                                                                              // 994
                        colStr = colStr.replace("rgb(", "").replace(")", "");                                          // 995
                        var rgbArr = colStr.split(",");                                                                // 996
                        var R = parseInt(rgbArr[0], 10);                                                               // 997
                        var G = parseInt(rgbArr[1], 10);                                                               // 998
                        var B = parseInt(rgbArr[2], 10);                                                               // 999
                        var gray = Math.round((255 - (0.299 * R + 0.587 * G + 0.114 * B)) * 0.9);                      // 1000
                        return "rgb(" + gray + ", " + gray + ", " + gray + ")";                                        // 1001
                    } catch (err) {                                                                                    // 1002
                        return "";                                                                                     // 1003
                    }                                                                                                  // 1004
                };                                                                                                     // 1005
                // Loop through the values of each data element and set a row                                          // 1006
                $.each(element.data, function (i, entry) {                                                             // 1007
                    if (i >= element.pageNum * settings.itemsPerPage && i < (element.pageNum * settings.itemsPerPage + settings.itemsPerPage)) {
                                                                                                                       // 1009
                        $.each(entry.values, function (j, day) {                                                       // 1010
                            var _bar = null;                                                                           // 1011
                                                                                                                       // 1012
                            switch (settings.scale) {                                                                  // 1013
                                // **Hourly data**                                                                     // 1014
                                case "hours":                                                                          // 1015
                                    var dFrom = tools.genId(tools.dateDeserialize(day.from).getTime(), element.scaleStep);
                                    var from = $(element).find('#dh-' + dFrom);                                        // 1017
                                                                                                                       // 1018
                                    var dTo = tools.genId(tools.dateDeserialize(day.to).getTime(), element.scaleStep); // 1019
                                    var to = $(element).find('#dh-' + dTo);                                            // 1020
                                                                                                                       // 1021
                                    var cFrom = from.attr("offset");                                                   // 1022
                                    var cTo = to.attr("offset");                                                       // 1023
                                    var dl = Math.floor((cTo - cFrom) / tools.getCellSize()) + 1;                      // 1024
                                                                                                                       // 1025
                                    _bar = core.createProgressBar(                                                     // 1026
                                                dl,                                                                    // 1027
                                                day.customClass ? day.customClass : "",                                // 1028
                                                day.desc ? day.desc : "",                                              // 1029
                                                day.label ? day.label : "",                                            // 1030
                                                day.dataObj ? day.dataObj : null                                       // 1031
                                            );                                                                         // 1032
                                                                                                                       // 1033
                                    // find row                                                                        // 1034
                                    var topEl = $(element).find("#rowheader" + i);                                     // 1035
                                                                                                                       // 1036
                                    var top = tools.getCellSize() * 5 + 2 + parseInt(topEl.attr("offset"), 10);        // 1037
                                    _bar.css({ 'top': top, 'left': Math.floor(cFrom) });                               // 1038
                                                                                                                       // 1039
                                    datapanel.append(_bar);                                                            // 1040
                                    break;                                                                             // 1041
                                                                                                                       // 1042
                                // **Weekly data**                                                                     // 1043
                                case "weeks":                                                                          // 1044
                                    var dtFrom = tools.dateDeserialize(day.from);                                      // 1045
                                    var dtTo = tools.dateDeserialize(day.to);                                          // 1046
                                                                                                                       // 1047
                                    if (dtFrom.getDate() <= 3 && dtFrom.getMonth() === 0) {                            // 1048
                                        dtFrom.setDate(dtFrom.getDate() + 4);                                          // 1049
                                    }                                                                                  // 1050
                                                                                                                       // 1051
                                    if (dtFrom.getDate() <= 3 && dtFrom.getMonth() === 0) {                            // 1052
                                        dtFrom.setDate(dtFrom.getDate() + 4);                                          // 1053
                                    }                                                                                  // 1054
                                                                                                                       // 1055
                                    if (dtTo.getDate() <= 3 && dtTo.getMonth() === 0) {                                // 1056
                                        dtTo.setDate(dtTo.getDate() + 4);                                              // 1057
                                    }                                                                                  // 1058
                                                                                                                       // 1059
                                    var from = $(element).find("#" + dtFrom.getWeekId());                              // 1060
                                                                                                                       // 1061
                                    var cFrom = from.attr("offset");                                                   // 1062
                                                                                                                       // 1063
                                    var to = $(element).find("#" + dtTo.getWeekId());                                  // 1064
                                    var cTo = to.attr("offset");                                                       // 1065
                                                                                                                       // 1066
                                    var dl = Math.round((cTo - cFrom) / tools.getCellSize()) + 1;                      // 1067
                                                                                                                       // 1068
                                    _bar = core.createProgressBar(                                                     // 1069
                                             dl,                                                                       // 1070
                                             day.customClass ? day.customClass : "",                                   // 1071
                                             day.desc ? day.desc : "",                                                 // 1072
                                             day.label ? day.label : "",                                               // 1073
                                            day.dataObj ? day.dataObj : null                                           // 1074
                                        );                                                                             // 1075
                                                                                                                       // 1076
                                    // find row                                                                        // 1077
                                    var topEl = $(element).find("#rowheader" + i);                                     // 1078
                                                                                                                       // 1079
                                    var top = tools.getCellSize() * 3 + 2 + parseInt(topEl.attr("offset"), 10);        // 1080
                                    _bar.css({ 'top': top, 'left': Math.floor(cFrom) });                               // 1081
                                                                                                                       // 1082
                                    datapanel.append(_bar);                                                            // 1083
                                    break;                                                                             // 1084
                                                                                                                       // 1085
                                // **Monthly data**                                                                    // 1086
                                case "months":                                                                         // 1087
                                    var dtFrom = tools.dateDeserialize(day.from);                                      // 1088
                                    var dtTo = tools.dateDeserialize(day.to);                                          // 1089
                                                                                                                       // 1090
                                    if (dtFrom.getDate() <= 3 && dtFrom.getMonth() === 0) {                            // 1091
                                        dtFrom.setDate(dtFrom.getDate() + 4);                                          // 1092
                                    }                                                                                  // 1093
                                                                                                                       // 1094
                                    if (dtFrom.getDate() <= 3 && dtFrom.getMonth() === 0) {                            // 1095
                                        dtFrom.setDate(dtFrom.getDate() + 4);                                          // 1096
                                    }                                                                                  // 1097
                                                                                                                       // 1098
                                    if (dtTo.getDate() <= 3 && dtTo.getMonth() === 0) {                                // 1099
                                        dtTo.setDate(dtTo.getDate() + 4);                                              // 1100
                                    }                                                                                  // 1101
                                                                                                                       // 1102
                                    var from = $(element).find("#dh-" + tools.genId(dtFrom.getTime()));                // 1103
                                    var cFrom = from.attr("offset");                                                   // 1104
                                    var to = $(element).find("#dh-" + tools.genId(dtTo.getTime()));                    // 1105
                                    var cTo = to.attr("offset");                                                       // 1106
                                    var dl = Math.round((cTo - cFrom) / tools.getCellSize()) + 1;                      // 1107
                                                                                                                       // 1108
                                    _bar = core.createProgressBar(                                                     // 1109
                                        dl,                                                                            // 1110
                                        day.customClass ? day.customClass : "",                                        // 1111
                                        day.desc ? day.desc : "",                                                      // 1112
                                        day.label ? day.label : "",                                                    // 1113
                                        day.dataObj ? day.dataObj : null                                               // 1114
                                    );                                                                                 // 1115
                                                                                                                       // 1116
                                    // find row                                                                        // 1117
                                    var topEl = $(element).find("#rowheader" + i);                                     // 1118
                                                                                                                       // 1119
                                    var top = tools.getCellSize() * 2 + 2 + parseInt(topEl.attr("offset"), 10);        // 1120
                                    _bar.css({ 'top': top, 'left': Math.floor(cFrom) });                               // 1121
                                                                                                                       // 1122
                                    datapanel.append(_bar);                                                            // 1123
                                    break;                                                                             // 1124
                                                                                                                       // 1125
                                // **Days**                                                                            // 1126
                                default:                                                                               // 1127
                                    var dFrom = tools.genId(tools.dateDeserialize(day.from).getTime());                // 1128
                                    var dTo = tools.genId(tools.dateDeserialize(day.to).getTime());                    // 1129
                                                                                                                       // 1130
                                    var from = $(element).find("#dh-" + dFrom);                                        // 1131
                                    var cFrom = from.attr("offset");                                                   // 1132
                                                                                                                       // 1133
                                    var dl = Math.floor(((dTo / 1000) - (dFrom / 1000)) / 86400) + 1;                  // 1134
                                    _bar = core.createProgressBar(                                                     // 1135
                                                dl,                                                                    // 1136
                                                day.customClass ? day.customClass : "",                                // 1137
                                                day.desc ? day.desc : "",                                              // 1138
                                                day.label ? day.label : "",                                            // 1139
                                                day.dataObj ? day.dataObj : null                                       // 1140
                                        );                                                                             // 1141
                                                                                                                       // 1142
                                    // find row                                                                        // 1143
                                    var topEl = $(element).find("#rowheader" + i);                                     // 1144
                                                                                                                       // 1145
                                    var top = tools.getCellSize() * 4 + 2 + parseInt(topEl.attr("offset"), 10);        // 1146
                                    _bar.css({ 'top': top, 'left': Math.floor(cFrom) });                               // 1147
                                                                                                                       // 1148
                                    datapanel.append(_bar);                                                            // 1149
                                                                                                                       // 1150
                                    break;                                                                             // 1151
                            }                                                                                          // 1152
                            var $l = _bar.find(".fn-label");                                                           // 1153
                            if ($l && _bar.length) {                                                                   // 1154
                                var gray = invertColor(_bar[0].style.backgroundColor);                                 // 1155
                                $l.css("color", gray);                                                                 // 1156
                            } else if ($l) {                                                                           // 1157
                                $l.css("color", "");                                                                   // 1158
                            }                                                                                          // 1159
                        });                                                                                            // 1160
                                                                                                                       // 1161
                    }                                                                                                  // 1162
                });                                                                                                    // 1163
            },                                                                                                         // 1164
            // **Navigation**                                                                                          // 1165
            navigateTo: function (element, val) {                                                                      // 1166
                var $rightPanel = $(element).find(".fn-gantt .rightPanel");                                            // 1167
                var $dataPanel = $rightPanel.find(".dataPanel");                                                       // 1168
                var rightPanelWidth = $rightPanel.width();                                                             // 1169
                var dataPanelWidth = $dataPanel.width();                                                               // 1170
                                                                                                                       // 1171
                switch (val) {                                                                                         // 1172
                    case "begin":                                                                                      // 1173
                        $dataPanel.animate({                                                                           // 1174
                            "margin-left": "0px"                                                                       // 1175
                        }, "fast", function () { core.repositionLabel(element); });                                    // 1176
                        element.scrollNavigation.panelMargin = 0;                                                      // 1177
                        break;                                                                                         // 1178
                    case "end":                                                                                        // 1179
                        var mLeft = dataPanelWidth - rightPanelWidth;                                                  // 1180
                        element.scrollNavigation.panelMargin = mLeft * -1;                                             // 1181
                        $dataPanel.animate({                                                                           // 1182
                            "margin-left": "-" + mLeft + "px"                                                          // 1183
                        }, "fast", function () { core.repositionLabel(element); });                                    // 1184
                        break;                                                                                         // 1185
                    case "now":                                                                                        // 1186
                        if (!element.scrollNavigation.canScroll || !$dataPanel.find(".today").length) {                // 1187
                            return false;                                                                              // 1188
                        }                                                                                              // 1189
                        var max_left = (dataPanelWidth - rightPanelWidth) * -1;                                        // 1190
                        var cur_marg = $dataPanel.css("margin-left").replace("px", "");                                // 1191
                        var val = $dataPanel.find(".today").offset().left - $dataPanel.offset().left;                  // 1192
                        val *= -1;                                                                                     // 1193
                        if (val > 0) {                                                                                 // 1194
                            val = 0;                                                                                   // 1195
                        } else if (val < max_left) {                                                                   // 1196
                            val = max_left;                                                                            // 1197
                        }                                                                                              // 1198
                        $dataPanel.animate({                                                                           // 1199
                            "margin-left": val + "px"                                                                  // 1200
                        }, "fast", core.repositionLabel(element));                                                     // 1201
                        element.scrollNavigation.panelMargin = val;                                                    // 1202
                        break;                                                                                         // 1203
                    default:                                                                                           // 1204
                        var max_left = (dataPanelWidth - rightPanelWidth) * -1;                                        // 1205
                        var cur_marg = $dataPanel.css("margin-left").replace("px", "");                                // 1206
                        var val = parseInt(cur_marg, 10) + val;                                                        // 1207
                        if (val <= 0 && val >= max_left) {                                                             // 1208
                            $dataPanel.animate({                                                                       // 1209
                                "margin-left": val + "px"                                                              // 1210
                            }, "fast", core.repositionLabel(element));                                                 // 1211
                        }                                                                                              // 1212
                        element.scrollNavigation.panelMargin = val;                                                    // 1213
                        break;                                                                                         // 1214
                }                                                                                                      // 1215
            },                                                                                                         // 1216
                                                                                                                       // 1217
            // Navigate to a specific page                                                                             // 1218
            navigatePage: function (element, val) {                                                                    // 1219
                if ((element.pageNum + val) >= 0 && (element.pageNum + val) < Math.ceil(element.rowsNum / settings.itemsPerPage)) {
                    core.waitToggle(element, true, function () {                                                       // 1221
                        element.pageNum += val;                                                                        // 1222
                        element.hPosition = $(".fn-gantt .dataPanel").css("margin-left").replace("px", "");            // 1223
                        element.scaleOldWidth = false;                                                                 // 1224
                        core.init(element);                                                                            // 1225
                    });                                                                                                // 1226
                }                                                                                                      // 1227
            },                                                                                                         // 1228
                                                                                                                       // 1229
            // Change zoom level                                                                                       // 1230
            zoomInOut: function (element, val) {                                                                       // 1231
                core.waitToggle(element, true, function () {                                                           // 1232
                                                                                                                       // 1233
                    var zoomIn = (val < 0);                                                                            // 1234
                                                                                                                       // 1235
                    var scaleSt = element.scaleStep + val * 3;                                                         // 1236
                    scaleSt = scaleSt <= 1 ? 1 : scaleSt === 4 ? 3 : scaleSt;                                          // 1237
                    var scale = settings.scale;                                                                        // 1238
                    var headerRows = element.headerRows;                                                               // 1239
                    if (settings.scale === "hours" && scaleSt >= 13) {                                                 // 1240
                        scale = "days";                                                                                // 1241
                        headerRows = 4;                                                                                // 1242
                        scaleSt = 13;                                                                                  // 1243
                    } else if (settings.scale === "days" && zoomIn) {                                                  // 1244
                        scale = "hours";                                                                               // 1245
                        headerRows = 5;                                                                                // 1246
                        scaleSt = 12;                                                                                  // 1247
                    } else if (settings.scale === "days" && !zoomIn) {                                                 // 1248
                        scale = "weeks";                                                                               // 1249
                        headerRows = 3;                                                                                // 1250
                        scaleSt = 13;                                                                                  // 1251
                    } else if (settings.scale === "weeks" && !zoomIn) {                                                // 1252
                        scale = "months";                                                                              // 1253
                        headerRows = 2;                                                                                // 1254
                        scaleSt = 14;                                                                                  // 1255
                    } else if (settings.scale === "weeks" && zoomIn) {                                                 // 1256
                        scale = "days";                                                                                // 1257
                        headerRows = 4;                                                                                // 1258
                        scaleSt = 13;                                                                                  // 1259
                    } else if (settings.scale === "months" && zoomIn) {                                                // 1260
                        scale = "weeks";                                                                               // 1261
                        headerRows = 3;                                                                                // 1262
                        scaleSt = 13;                                                                                  // 1263
                    }                                                                                                  // 1264
                                                                                                                       // 1265
                    if ((zoomIn && $.inArray(scale, scales) < $.inArray(settings.minScale, scales))                    // 1266
                        || (!zoomIn && $.inArray(scale, scales) > $.inArray(settings.maxScale, scales))) {             // 1267
                        core.init(element);                                                                            // 1268
                        return;                                                                                        // 1269
                    }                                                                                                  // 1270
                    element.scaleStep = scaleSt;                                                                       // 1271
                    settings.scale = scale;                                                                            // 1272
                    element.headerRows = headerRows;                                                                   // 1273
                    var $rightPanel = $(element).find(".fn-gantt .rightPanel");                                        // 1274
                    var $dataPanel = $rightPanel.find(".dataPanel");                                                   // 1275
                    element.hPosition = $dataPanel.css("margin-left").replace("px", "");                               // 1276
                    element.scaleOldWidth = ($dataPanel.width() - $rightPanel.width());                                // 1277
                                                                                                                       // 1278
                    if (settings.useCookie) {                                                                          // 1279
                        $.cookie(this.cookieKey + "CurrentScale", settings.scale);                                     // 1280
                        // reset scrollPos                                                                             // 1281
                        $.cookie(this.cookieKey + "ScrollPos", null);                                                  // 1282
                    }                                                                                                  // 1283
                    core.init(element);                                                                                // 1284
                });                                                                                                    // 1285
            },                                                                                                         // 1286
                                                                                                                       // 1287
            // Move chart via mouseclick                                                                               // 1288
            mouseScroll: function (element, e) {                                                                       // 1289
                var $dataPanel = $(element).find(".fn-gantt .dataPanel");                                              // 1290
                $dataPanel.css("cursor", "move");                                                                      // 1291
                var bPos = $dataPanel.offset();                                                                        // 1292
                var mPos = element.scrollNavigation.mouseX === null ? e.pageX : element.scrollNavigation.mouseX;       // 1293
                var delta = e.pageX - mPos;                                                                            // 1294
                element.scrollNavigation.mouseX = e.pageX;                                                             // 1295
                                                                                                                       // 1296
                core.scrollPanel(element, delta);                                                                      // 1297
                                                                                                                       // 1298
                clearTimeout(element.scrollNavigation.repositionDelay);                                                // 1299
                element.scrollNavigation.repositionDelay = setTimeout(core.repositionLabel, 50, element);              // 1300
            },                                                                                                         // 1301
                                                                                                                       // 1302
            // Move chart via mousewheel                                                                               // 1303
            wheelScroll: function (element, e) {                                                                       // 1304
                e.preventDefault(); // e is a jQuery Event                                                             // 1305
                                                                                                                       // 1306
                // attempts to normalize scroll wheel velocity                                                         // 1307
                var delta = ( 'detail' in e ? e.detail :                                                               // 1308
                              'wheelDelta' in e.originalEvent ? - 1/120 * e.originalEvent.wheelDelta :                 // 1309
                              e.originalEvent.deltaY ? e.originalEvent.deltaY / Math.abs(e.originalEvent.deltaY) :     // 1310
                              e.originalEvent.detail );                                                                // 1311
                                                                                                                       // 1312
                // simpler normalization, ignoring per-device/browser/platform acceleration & semantic variations      // 1313
                //var delta = e.detail || - (e = e.originalEvent).wheelData || e.deltaY /* || e.deltaX */ || e.detail; // 1314
                //delta = ( delta / Math.abs(delta) ) || 0;                                                            // 1315
                                                                                                                       // 1316
                core.scrollPanel(element, -50 * delta);                                                                // 1317
                                                                                                                       // 1318
                clearTimeout(element.scrollNavigation.repositionDelay);                                                // 1319
                element.scrollNavigation.repositionDelay = setTimeout(core.repositionLabel, 50, element);              // 1320
            },                                                                                                         // 1321
                                                                                                                       // 1322
            // Move chart via slider control                                                                           // 1323
            sliderScroll: function (element, e) {                                                                      // 1324
                var $sliderBar = $(element).find(".nav-slider-bar");                                                   // 1325
                var $sliderBarBtn = $sliderBar.find(".nav-slider-button");                                             // 1326
                var $rightPanel = $(element).find(".fn-gantt .rightPanel");                                            // 1327
                var $dataPanel = $rightPanel.find(".dataPanel");                                                       // 1328
                                                                                                                       // 1329
                var bPos = $sliderBar.offset();                                                                        // 1330
                var bWidth = $sliderBar.width();                                                                       // 1331
                var wButton = $sliderBarBtn.width();                                                                   // 1332
                                                                                                                       // 1333
                var pos, mLeft;                                                                                        // 1334
                                                                                                                       // 1335
                if ((e.pageX >= bPos.left) && (e.pageX <= bPos.left + bWidth)) {                                       // 1336
                    pos = e.pageX - bPos.left;                                                                         // 1337
                    pos = pos - wButton / 2;                                                                           // 1338
                    $sliderBarBtn.css("left", pos);                                                                    // 1339
                                                                                                                       // 1340
                    mLeft = $dataPanel.width() - $rightPanel.width();                                                  // 1341
                                                                                                                       // 1342
                    var pPos = pos * mLeft / bWidth * -1;                                                              // 1343
                    if (pPos >= 0) {                                                                                   // 1344
                        $dataPanel.css("margin-left", "0px");                                                          // 1345
                        element.scrollNavigation.panelMargin = 0;                                                      // 1346
                    } else if (pos >= bWidth - (wButton * 1)) {                                                        // 1347
                        $dataPanel.css("margin-left", mLeft * -1 + "px");                                              // 1348
                        element.scrollNavigation.panelMargin = mLeft * -1;                                             // 1349
                    } else {                                                                                           // 1350
                        $dataPanel.css("margin-left", pPos + "px");                                                    // 1351
                        element.scrollNavigation.panelMargin = pPos;                                                   // 1352
                    }                                                                                                  // 1353
                    clearTimeout(element.scrollNavigation.repositionDelay);                                            // 1354
                    element.scrollNavigation.repositionDelay = setTimeout(core.repositionLabel, 5, element);           // 1355
                }                                                                                                      // 1356
            },                                                                                                         // 1357
                                                                                                                       // 1358
            // Update scroll panel margins                                                                             // 1359
            scrollPanel: function (element, delta) {                                                                   // 1360
                if (!element.scrollNavigation.canScroll) {                                                             // 1361
                    return false;                                                                                      // 1362
                }                                                                                                      // 1363
                var _panelMargin = parseInt(element.scrollNavigation.panelMargin, 10) + delta;                         // 1364
                if (_panelMargin > 0) {                                                                                // 1365
                    element.scrollNavigation.panelMargin = 0;                                                          // 1366
                    $(element).find(".fn-gantt .dataPanel").css("margin-left", element.scrollNavigation.panelMargin + "px");
                } else if (_panelMargin < element.scrollNavigation.panelMaxPos * -1) {                                 // 1368
                    element.scrollNavigation.panelMargin = element.scrollNavigation.panelMaxPos * -1;                  // 1369
                    $(element).find(".fn-gantt .dataPanel").css("margin-left", element.scrollNavigation.panelMargin + "px");
                } else {                                                                                               // 1371
                    element.scrollNavigation.panelMargin = _panelMargin;                                               // 1372
                    $(element).find(".fn-gantt .dataPanel").css("margin-left", element.scrollNavigation.panelMargin + "px");
                }                                                                                                      // 1374
                core.synchronizeScroller(element);                                                                     // 1375
            },                                                                                                         // 1376
                                                                                                                       // 1377
            // Synchronize scroller                                                                                    // 1378
            synchronizeScroller: function (element) {                                                                  // 1379
                if (settings.navigate === "scroll") {                                                                  // 1380
                    var $rightPanel = $(element).find(".fn-gantt .rightPanel");                                        // 1381
                    var $dataPanel = $rightPanel.find(".dataPanel");                                                   // 1382
                    var $sliderBar = $(element).find(".nav-slider-bar");                                               // 1383
                    var $sliderBtn = $sliderBar.find(".nav-slider-button");                                            // 1384
                                                                                                                       // 1385
                    var bWidth = $sliderBar.width();                                                                   // 1386
                    var wButton = $sliderBtn.width();                                                                  // 1387
                                                                                                                       // 1388
                    var mLeft = $dataPanel.width() - $rightPanel.width();                                              // 1389
                    var hPos = 0;                                                                                      // 1390
                    if ($dataPanel.css("margin-left")) {                                                               // 1391
                        hPos = $dataPanel.css("margin-left").replace("px", "");                                        // 1392
                    }                                                                                                  // 1393
                    var pos = hPos * bWidth / mLeft - $sliderBtn.width() * 0.25;                                       // 1394
                    pos = pos > 0 ? 0 : (pos * -1 >= bWidth - (wButton * 0.75)) ? (bWidth - (wButton * 1.25)) * -1 : pos;
                    $sliderBtn.css("left", pos * -1);                                                                  // 1396
                }                                                                                                      // 1397
            },                                                                                                         // 1398
                                                                                                                       // 1399
            // Reposition data labels                                                                                  // 1400
            repositionLabel: function (element) {                                                                      // 1401
                setTimeout(function () {                                                                               // 1402
                    var $dataPanel;                                                                                    // 1403
                    if (!element) {                                                                                    // 1404
                        $dataPanel = $(".fn-gantt .rightPanel .dataPanel");                                            // 1405
                    } else {                                                                                           // 1406
                        var $rightPanel = $(element).find(".fn-gantt .rightPanel");                                    // 1407
                        $dataPanel = $rightPanel.find(".dataPanel");                                                   // 1408
                    }                                                                                                  // 1409
                                                                                                                       // 1410
                    if (settings.useCookie) {                                                                          // 1411
                        $.cookie(this.cookieKey + "ScrollPos", $dataPanel.css("margin-left").replace("px", ""));       // 1412
                    }                                                                                                  // 1413
                }, 500);                                                                                               // 1414
            },                                                                                                         // 1415
                                                                                                                       // 1416
            // waitToggle                                                                                              // 1417
            waitToggle: function (element, show, fn) {                                                                 // 1418
                if (show) {                                                                                            // 1419
                    var eo = $(element).offset();                                                                      // 1420
                    var ew = $(element).outerWidth();                                                                  // 1421
                    var eh = $(element).outerHeight();                                                                 // 1422
                                                                                                                       // 1423
                    if (!element.loader) {                                                                             // 1424
                        element.loader = $('<div class="fn-gantt-loader">'                                             // 1425
                        + '<div class="fn-gantt-loader-spinner"><span>' + settings.waitText + '</span></div></div>');  // 1426
                    }                                                                                                  // 1427
                    $(element).append(element.loader);                                                                 // 1428
                    setTimeout(fn, 500);                                                                               // 1429
                                                                                                                       // 1430
                } else {                                                                                               // 1431
                    if (element.loader) {                                                                              // 1432
                        element.loader.remove();                                                                       // 1433
                    }                                                                                                  // 1434
                    element.loader = null;                                                                             // 1435
                }                                                                                                      // 1436
            }                                                                                                          // 1437
        };                                                                                                             // 1438
                                                                                                                       // 1439
        // Utility functions                                                                                           // 1440
        // =================                                                                                           // 1441
        var tools = {                                                                                                  // 1442
                                                                                                                       // 1443
            // Return the maximum available date in data depending on the scale                                        // 1444
            getMaxDate: function (element) {                                                                           // 1445
                var maxDate = null;                                                                                    // 1446
                $.each(element.data, function (i, entry) {                                                             // 1447
                    $.each(entry.values, function (i, date) {                                                          // 1448
                        maxDate = maxDate < tools.dateDeserialize(date.to) ? tools.dateDeserialize(date.to) : maxDate; // 1449
                    });                                                                                                // 1450
                });                                                                                                    // 1451
                maxDate = maxDate || new Date();                                                                       // 1452
                switch (settings.scale) {                                                                              // 1453
                    case "hours":                                                                                      // 1454
                        maxDate.setHours(Math.ceil((maxDate.getHours()) / element.scaleStep) * element.scaleStep);     // 1455
                        maxDate.setHours(maxDate.getHours() + element.scaleStep * 3);                                  // 1456
                        break;                                                                                         // 1457
                    case "weeks":                                                                                      // 1458
                        var bd = new Date(maxDate.getTime());                                                          // 1459
                        var bd = new Date(bd.setDate(bd.getDate() + 3 * 7));                                           // 1460
                        var md = Math.floor(bd.getDate() / 7) * 7;                                                     // 1461
                        maxDate = new Date(bd.getFullYear(), bd.getMonth(), md === 0 ? 4 : md - 3);                    // 1462
                        break;                                                                                         // 1463
                    case "months":                                                                                     // 1464
                        var bd = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);                               // 1465
                        bd.setMonth(bd.getMonth() + 2);                                                                // 1466
                        maxDate = new Date(bd.getFullYear(), bd.getMonth(), 1);                                        // 1467
                        break;                                                                                         // 1468
                    default:                                                                                           // 1469
                        maxDate.setHours(0);                                                                           // 1470
                        maxDate.setDate(maxDate.getDate() + 3);                                                        // 1471
                        break;                                                                                         // 1472
                }                                                                                                      // 1473
                return maxDate;                                                                                        // 1474
            },                                                                                                         // 1475
                                                                                                                       // 1476
            // Return the minimum available date in data depending on the scale                                        // 1477
            getMinDate: function (element) {                                                                           // 1478
                var minDate = null;                                                                                    // 1479
                $.each(element.data, function (i, entry) {                                                             // 1480
                    $.each(entry.values, function (i, date) {                                                          // 1481
                        minDate = minDate > tools.dateDeserialize(date.from) || minDate === null ? tools.dateDeserialize(date.from) : minDate;
                    });                                                                                                // 1483
                });                                                                                                    // 1484
                minDate = minDate || new Date();                                                                       // 1485
                switch (settings.scale) {                                                                              // 1486
                    case "hours":                                                                                      // 1487
                        minDate.setHours(Math.floor((minDate.getHours()) / element.scaleStep) * element.scaleStep);    // 1488
                        minDate.setHours(minDate.getHours() - element.scaleStep * 3);                                  // 1489
                        break;                                                                                         // 1490
                    case "weeks":                                                                                      // 1491
                        var bd = new Date(minDate.getTime());                                                          // 1492
                        var bd = new Date(bd.setDate(bd.getDate() - 3 * 7));                                           // 1493
                        var md = Math.floor(bd.getDate() / 7) * 7;                                                     // 1494
                        minDate = new Date(bd.getFullYear(), bd.getMonth(), md === 0 ? 4 : md - 3);                    // 1495
                        break;                                                                                         // 1496
                    case "months":                                                                                     // 1497
                        var bd = new Date(minDate.getFullYear(), minDate.getMonth(), 1);                               // 1498
                        bd.setMonth(bd.getMonth() - 3);                                                                // 1499
                        minDate = new Date(bd.getFullYear(), bd.getMonth(), 1);                                        // 1500
                        break;                                                                                         // 1501
                    default:                                                                                           // 1502
                        minDate.setHours(0);                                                                           // 1503
                        minDate.setDate(minDate.getDate() - 3);                                                        // 1504
                        break;                                                                                         // 1505
                }                                                                                                      // 1506
                return minDate;                                                                                        // 1507
            },                                                                                                         // 1508
                                                                                                                       // 1509
            // Return an array of Date objects between `from` and `to`                                                 // 1510
            parseDateRange: function (from, to) {                                                                      // 1511
                var current = new Date(from.getTime());                                                                // 1512
                var end = new Date(to.getTime()); // <- never used?                                                    // 1513
                var ret = [];                                                                                          // 1514
                var i = 0;                                                                                             // 1515
                do {                                                                                                   // 1516
                    ret[i++] = new Date(current.getTime());                                                            // 1517
                    current.setDate(current.getDate() + 1);                                                            // 1518
                } while (current.getTime() <= to.getTime());                                                           // 1519
                return ret;                                                                                            // 1520
                                                                                                                       // 1521
            },                                                                                                         // 1522
                                                                                                                       // 1523
            // Return an array of Date objects between `from` and `to`,                                                // 1524
            // scaled hourly                                                                                           // 1525
            parseTimeRange: function (from, to, scaleStep) {                                                           // 1526
                var current = new Date(from);                                                                          // 1527
                var end = new Date(to);                                                                                // 1528
                                                                                                                       // 1529
                // GR: Fix begin                                                                                       // 1530
                current.setMilliseconds(0);                                                                            // 1531
                current.setSeconds(0);                                                                                 // 1532
                current.setMinutes(0);                                                                                 // 1533
                current.setHours(0);                                                                                   // 1534
                                                                                                                       // 1535
                end.setMilliseconds(0);                                                                                // 1536
                end.setSeconds(0);                                                                                     // 1537
                if (end.getMinutes() > 0 || end.getHours() > 0) {                                                      // 1538
                    end.setMinutes(0);                                                                                 // 1539
                    end.setHours(0);                                                                                   // 1540
                    end.setTime(end.getTime() + (86400000)); // Add day                                                // 1541
                }                                                                                                      // 1542
                // GR: Fix end                                                                                         // 1543
                                                                                                                       // 1544
                var ret = [];                                                                                          // 1545
                var i = 0;                                                                                             // 1546
                for(;;) {                                                                                              // 1547
                    var dayStartTime = new Date(current);                                                              // 1548
                    dayStartTime.setHours(Math.floor((current.getHours()) / scaleStep) * scaleStep);                   // 1549
                                                                                                                       // 1550
                    if (ret[i] && dayStartTime.getDay() !== ret[i].getDay()) {                                         // 1551
                        // If mark-cursor jumped to next day, make sure it starts at 0 hours                           // 1552
                        dayStartTime.setHours(0);                                                                      // 1553
                    }                                                                                                  // 1554
                    ret[i] = dayStartTime;                                                                             // 1555
                                                                                                                       // 1556
                    // Note that we use ">" because we want to include the end-time point.                             // 1557
                    if (current.getTime() > to.getTime()) break;                                                       // 1558
                                                                                                                       // 1559
                    /* BUG-2: current is moved backwards producing a dead-lock! (crashes chrome/IE/firefox)            // 1560
                     * SEE: https://github.com/taitems/jQuery.Gantt/issues/62                                          // 1561
                    if (current.getDay() !== ret[i].getDay()) {                                                        // 1562
                       current.setHours(0);                                                                            // 1563
                    }                                                                                                  // 1564
                    */                                                                                                 // 1565
                                                                                                                       // 1566
                    // GR Fix Begin                                                                                    // 1567
                    current = ktkGetNextDate(dayStartTime, scaleStep);                                                 // 1568
                    // GR Fix End                                                                                      // 1569
                                                                                                                       // 1570
                    i++;                                                                                               // 1571
                }                                                                                                      // 1572
                                                                                                                       // 1573
                return ret;                                                                                            // 1574
            },                                                                                                         // 1575
                                                                                                                       // 1576
            // Return an array of Date objects between a range of weeks                                                // 1577
            // between `from` and `to`                                                                                 // 1578
            parseWeeksRange: function (from, to) {                                                                     // 1579
                                                                                                                       // 1580
                var current = new Date(from);                                                                          // 1581
                var end = new Date(to); // <- never used?                                                              // 1582
                                                                                                                       // 1583
                var ret = [];                                                                                          // 1584
                var i = 0;                                                                                             // 1585
                do {                                                                                                   // 1586
                    if (current.getDay() === 0) {                                                                      // 1587
                        ret[i++] = current.getDayForWeek();                                                            // 1588
                    }                                                                                                  // 1589
                    current.setDate(current.getDate() + 1);                                                            // 1590
                } while (current.getTime() <= to.getTime());                                                           // 1591
                                                                                                                       // 1592
                return ret;                                                                                            // 1593
            },                                                                                                         // 1594
                                                                                                                       // 1595
                                                                                                                       // 1596
            // Return an array of Date objects between a range of months                                               // 1597
            // between `from` and `to`                                                                                 // 1598
            parseMonthsRange: function (from, to) {                                                                    // 1599
                                                                                                                       // 1600
                var current = new Date(from);                                                                          // 1601
                var end = new Date(to); // <- never used?                                                              // 1602
                                                                                                                       // 1603
                var ret = [];                                                                                          // 1604
                var i = 0;                                                                                             // 1605
                do {                                                                                                   // 1606
                    ret[i++] = new Date(current.getFullYear(), current.getMonth(), 1);                                 // 1607
                    current.setMonth(current.getMonth() + 1);                                                          // 1608
                } while (current.getTime() <= to.getTime());                                                           // 1609
                                                                                                                       // 1610
                return ret;                                                                                            // 1611
            },                                                                                                         // 1612
                                                                                                                       // 1613
            // Deserialize a date from a string or integer                                                             // 1614
            dateDeserialize: function (date) {                                                                         // 1615
                if (typeof date === "string") {                                                                        // 1616
                    date = date.replace(/\/Date\((.*)\)\//, "$1");                                                     // 1617
                    date = $.isNumeric(date) ? parseInt(date, 10) : $.trim(date);                                      // 1618
                }                                                                                                      // 1619
                return new Date( date );                                                                               // 1620
            },                                                                                                         // 1621
                                                                                                                       // 1622
            // Generate an id for a date                                                                               // 1623
            genId: function (ticks) {                                                                                  // 1624
                var t = new Date(ticks);                                                                               // 1625
                switch (settings.scale) {                                                                              // 1626
                    case "hours":                                                                                      // 1627
                        var hour = t.getHours();                                                                       // 1628
                        if (arguments.length >= 2) {                                                                   // 1629
                            hour = (Math.floor((t.getHours()) / arguments[1]) * arguments[1]);                         // 1630
                        }                                                                                              // 1631
                        return (new Date(t.getFullYear(), t.getMonth(), t.getDate(), hour)).getTime();                 // 1632
                    case "weeks":                                                                                      // 1633
                        var y = t.getFullYear();                                                                       // 1634
                        var w = t.getDayForWeek().getWeekOfYear();                                                     // 1635
                        var m = t.getMonth();                                                                          // 1636
                        if (m === 11 && w === 1) {                                                                     // 1637
                            y++;                                                                                       // 1638
                        }                                                                                              // 1639
                        return y + "-" + w;                                                                            // 1640
                    case "months":                                                                                     // 1641
                        return t.getFullYear() + "-" + t.getMonth();                                                   // 1642
                    default:                                                                                           // 1643
                        return (new Date(t.getFullYear(), t.getMonth(), t.getDate())).getTime();                       // 1644
                }                                                                                                      // 1645
            },                                                                                                         // 1646
                                                                                                                       // 1647
            // normalizes an array of dates into a map of start-of-day millisecond values                              // 1648
            _datesToDays: function ( dates ) {                                                                         // 1649
                var dayMap = {};                                                                                       // 1650
                for (var i = 0, len = dates.length, day; i < len; i++) {                                               // 1651
                    day = tools.dateDeserialize( dates[i] );                                                           // 1652
                    dayMap[ day.setHours(0, 0, 0, 0) ] = true;                                                         // 1653
                }                                                                                                      // 1654
                return dayMap;                                                                                         // 1655
            },                                                                                                         // 1656
            // Returns true when the given date appears in the array of holidays, if provided                          // 1657
            isHoliday: (function() { // IIFE                                                                           // 1658
                // short-circuits the function if no holidays option was passed                                        // 1659
                if (!settings.holidays) {                                                                              // 1660
                  return function () { return false; };                                                                // 1661
                }                                                                                                      // 1662
                var holidays = false;                                                                                  // 1663
                // returns the function that will be used to check for holidayness of a given date                     // 1664
                return function(date) {                                                                                // 1665
                    if (!holidays) {                                                                                   // 1666
                      holidays = tools._datesToDays( settings.holidays );                                              // 1667
                    }                                                                                                  // 1668
                    return !!holidays[                                                                                 // 1669
                      // assumes numeric dates are already normalized to start-of-day                                  // 1670
                      $.isNumeric(date) ?                                                                              // 1671
                      date :                                                                                           // 1672
                      ( new Date(date.getFullYear(), date.getMonth(), date.getDate()) ).getTime()                      // 1673
                    ];                                                                                                 // 1674
                };                                                                                                     // 1675
            })(),                                                                                                      // 1676
                                                                                                                       // 1677
            // Get the current cell size                                                                               // 1678
            _getCellSize: null,                                                                                        // 1679
            getCellSize: function () {                                                                                 // 1680
                if (!tools._getCellSize) {                                                                             // 1681
                    $("body").append(                                                                                  // 1682
                        $('<div style="display: none; position: absolute;" class="fn-gantt" id="measureCellWidth"><div class="row"></div></div>')
                    );                                                                                                 // 1684
                    tools._getCellSize = $("#measureCellWidth .row").height();                                         // 1685
                    $("#measureCellWidth").empty().remove();                                                           // 1686
                }                                                                                                      // 1687
                return tools._getCellSize;                                                                             // 1688
            },                                                                                                         // 1689
                                                                                                                       // 1690
            // Get the current size of the right panel                                                                 // 1691
            getRightPanelSize: function () {                                                                           // 1692
                $("body").append(                                                                                      // 1693
                    $('<div style="display: none; position: absolute;" class="fn-gantt" id="measureCellWidth"><div class="rightPanel"></div></div>')
                );                                                                                                     // 1695
                var ret = $("#measureCellWidth .rightPanel").height();                                                 // 1696
                $("#measureCellWidth").empty().remove();                                                               // 1697
                return ret;                                                                                            // 1698
            },                                                                                                         // 1699
                                                                                                                       // 1700
            // Get the current page height                                                                             // 1701
            getPageHeight: function (element) {                                                                        // 1702
                return element.pageNum + 1 === element.pageCount ? element.rowsOnLastPage * tools.getCellSize() : settings.itemsPerPage * tools.getCellSize();
            },                                                                                                         // 1704
                                                                                                                       // 1705
            // Get the current margin size of the progress bar                                                         // 1706
            _getProgressBarMargin: null,                                                                               // 1707
            getProgressBarMargin: function () {                                                                        // 1708
                if (!tools._getProgressBarMargin && tools._getProgressBarMargin !== 0) {                               // 1709
                    $("body").append(                                                                                  // 1710
                        $('<div style="display: none; position: absolute;" id="measureBarWidth" ><div class="fn-gantt"><div class="rightPanel"><div class="dataPanel"><div class="row day"><div class="bar" /></div></div></div></div></div>')
                    );                                                                                                 // 1712
                    tools._getProgressBarMargin = parseInt($("#measureBarWidth .fn-gantt .rightPanel .day .bar").css("margin-left").replace("px", ""), 10);
                    tools._getProgressBarMargin += parseInt($("#measureBarWidth .fn-gantt .rightPanel .day .bar").css("margin-right").replace("px", ""), 10);
                    $("#measureBarWidth").empty().remove();                                                            // 1715
                }                                                                                                      // 1716
                return tools._getProgressBarMargin;                                                                    // 1717
            }                                                                                                          // 1718
        };                                                                                                             // 1719
                                                                                                                       // 1720
                                                                                                                       // 1721
        this.each(function () {                                                                                        // 1722
            this.data = null;        // Received data                                                                  // 1723
            this.pageNum = 0;        // Current page number                                                            // 1724
            this.pageCount = 0;      // Available pages count                                                          // 1725
            this.rowsOnLastPage = 0; // How many rows on last page                                                     // 1726
            this.rowsNum = 0;        // Number of total rows                                                           // 1727
            this.hPosition = 0;      // Current position on diagram (Horizontal)                                       // 1728
            this.dateStart = null;                                                                                     // 1729
            this.dateEnd = null;                                                                                       // 1730
            this.scrollClicked = false;                                                                                // 1731
            this.scaleOldWidth = null;                                                                                 // 1732
            this.headerRows = null;                                                                                    // 1733
                                                                                                                       // 1734
            // Update cookie with current scale                                                                        // 1735
            if (settings.useCookie) {                                                                                  // 1736
                var sc = $.cookie(this.cookieKey + "CurrentScale");                                                    // 1737
                if (sc) {                                                                                              // 1738
                    settings.scale = $.cookie(this.cookieKey + "CurrentScale");                                        // 1739
                } else {                                                                                               // 1740
                    $.cookie(this.cookieKey + "CurrentScale", settings.scale);                                         // 1741
                }                                                                                                      // 1742
            }                                                                                                          // 1743
                                                                                                                       // 1744
            switch (settings.scale) {                                                                                  // 1745
                //case "hours": this.headerRows = 5; this.scaleStep = 8; break;                                        // 1746
                case "hours": this.headerRows = 5; this.scaleStep = 1; break;                                          // 1747
                case "weeks": this.headerRows = 3; this.scaleStep = 13; break;                                         // 1748
                case "months": this.headerRows = 2; this.scaleStep = 14; break;                                        // 1749
                default: this.headerRows = 4; this.scaleStep = 13; break;                                              // 1750
            }                                                                                                          // 1751
                                                                                                                       // 1752
            this.scrollNavigation = {                                                                                  // 1753
                panelMouseDown: false,                                                                                 // 1754
                scrollerMouseDown: false,                                                                              // 1755
                mouseX: null,                                                                                          // 1756
                panelMargin: 0,                                                                                        // 1757
                repositionDelay: 0,                                                                                    // 1758
                panelMaxPos: 0,                                                                                        // 1759
                canScroll: true                                                                                        // 1760
            };                                                                                                         // 1761
                                                                                                                       // 1762
            this.gantt = null;                                                                                         // 1763
            this.loader = null;                                                                                        // 1764
                                                                                                                       // 1765
            core.create(this);                                                                                         // 1766
                                                                                                                       // 1767
        });                                                                                                            // 1768
                                                                                                                       // 1769
    };                                                                                                                 // 1770
})(jQuery);                                                                                                            // 1771
                                                                                                                       // 1772
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
