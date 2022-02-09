d3.horizon
==============

[![NPM package][npm-img]][npm-url]
[![Build Size][build-size-img]][build-size-url]
[![NPM Downloads][npm-downloads-img]][npm-downloads-url]

A D3 based component that renders a [Horizon type area chart](https://hci.stanford.edu/publications/2009/heer-horizon-chi09.pdf).

Heavily based in previous work by [Mike Bostock](https://github.com/mbostock)'s [d3-horizon plugin](https://github.com/d3/d3-plugins/tree/master/horizon), extended to support `HTML5 Canvas` rendering and migrated for `D3 v4+` compatibility.

![Horizon Chart](http://vis.berkeley.edu/papers/horizon/construction.png)

Check out the examples:
* [Basic with random generated data](https://vasturiano.github.io/d3-horizon/example/basic/) ([source](https://github.com/vasturiano/d3-horizon/blob/master/example/basic/index.html))
* [Change `bands` / `mode` dynamically](https://vasturiano.github.io/d3-horizon/example/bands/) ([source](https://github.com/vasturiano/d3-horizon/blob/master/example/bands/index.html))

## Quick start

```js
import d3 from 'd3-horizon';
```
or
```js
d3.horizon = require('d3-horizon');
```
or even
```html
<script src="//unpkg.com/d3-horizon"></script>
```
then
```js
d3.horizon()
    .data(<myData>)
    (<domElement>);
```

## API reference

### Initialisation
```js
d3.horizon({ configOptions })(<domElement>)
```

| Config options | Description | Default |
| --- | --- | :--: |
| <b>useCanvas</b>: <i>boolean</i> | Whether to use **HTML5 Canvas** (`true`) or **SVG** (`false`) as rendering method. | `true` |

### Methods

| Method | Description | Default |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |:-------------:|
| <b>width</b>([<i>px</i>]) | Getter/setter for the chart width. | *&lt;window width&gt;* |
| <b>height</b>([<i>px</i>]) | Getter/setter for the chart height. | 40 |
| <b>data</b>([<i>array</i>]) | Getter/setter for chart data, as an array of data points. The syntax of each item is defined by the `x` and `y` accessor methods. | `[]` |
| <b>x</b>([<i>fn</i> or <i>str</i>]) | Getter/setter for the data point accessor function to extract the `x` axis values. A `function` receives the data point as input and should return a number. A string indicates the object attribute to use. | `d => d[0]` |
| <b>y</b>([<i>fn</i> or <i>str</i>]) | Getter/setter for the data point accessor function to extract the `y` axis values. A `function` receives the data point as input and should return a number. A string indicates the object attribute to use. | `d => d[1]` |
| <b>xMin</b>([<i>number</i>]) | Getter/setter for the x axis minimum value. By default (`undefined`), the min X is calculated dynamically from the data. | `undefined` |
| <b>xMax</b>([<i>number</i>]) | Getter/setter for the x axis maximum value. By default (`undefined`), the max X is calculated dynamically from the data. | `undefined` |
| <b>yExtent</b>([<i>number</i>]) | Getter/setter for the y axis maximum absolute value. By default (`undefined`), the max Y is calculated dynamically from the data. | `undefined` |
| <b>yScaleExp</b>([<i>number</i>]) | Getter/setter for the y axis scale exponent. Only values `> 0` are supported. An exponent of `1` (default) represents a linear Y scale. | 1 |
| <b>yAggregation</b>([<i>fn([numbers])</i>]) | Getter/setter for the method to reduce multiple values to a single number, in case there is more than one `y` value per unique `x`. | `vals => vals.reduce((a,b) => a+b)` (accumulate) |
| <b>bands</b>([<i>int</i>]) | Getter/setter for the number of horizon bands to use. | 4 |
| <b>mode</b>([<i>'offset'</i> or <i>'mirror'</i>]) | Getter/setter for the mode used to represent negative values. `offset` renders the negative values from the top of the chart downwards, while `mirror` represents them upwards as if they were positive values, albeit with a different color. | `offset` |
| <b>positiveColors</b>([<i>[colors]</i>]) | Getter/setter for the colors to use for the positive value bands. The top band gets assigned the max color, and the other bands are colored according to the interpolation of the color stops. Minimum two colors are required. | `['white', 'midnightBlue']` |
| <b>positiveColorStops</b>([<i>[stopNumbers]</i>]) | Getter/setter for the stop values to use in the interpolation of the positive colors. Each stop represents an interpolation ratio and only values between ]0, 1[ (excluding) are permitted. The stops are used to interpolate the middle colors in `positiveColors` and are only applicable if there are more than 2 colors. If the number of stops is less than number of middle colors, linear interpolation is used to populate the remaining stops. A value of `undefined` (default) results in complete linear interpolation. | `undefined` |
| <b>negativeColors</b>([<i>[colors]</i>]) | Getter/setter for the colors to use for the negative value bands. The top band gets assigned the max color, and the other bands are colored according to the interpolation of the color stops. Minimum two colors are required. | `['white', 'crimson']` |
| <b>negativeColorStops</b>([<i>[stopNumbers]</i>]) | Getter/setter for the stop values to use in the interpolation of the negative colors. Each stop represents an interpolation ratio and only values between ]0, 1[ (excluding) are permitted. The stops are used to interpolate the middle colors in `negativeColors` and are only applicable if there are more than 2 colors. If the number of stops is less than number of middle colors, linear interpolation is used to populate the remaining stops. A value of `undefined` (default) results in complete linear interpolation. | `undefined` |
| <b>interpolationCurve</b>([<i>d3CurveFn</i>]) | Getter/setter for the interpolation curve function used to draw lines between points. Should be a [d3 curve function](https://github.com/d3/d3-shape#curves). A `falsy` value sets linear interpolation ([curveLinear](https://github.com/d3/d3-shape#curveLinear)). | [curveBasis](https://github.com/d3/d3-shape#curveBasis) |
| <b>duration</b>([<i>ms</i>]) | Getter/setter for the duration (in milliseconds) of the transitions between states. | 0 |
| <b>tooltipContent</b>([<i>fn({x, y, points})</i>]) | Getter/setter for the tooltip content accessor function. Accepts plain-text or HTML. A value of `null` will permanently hide the tooltip. | ```({ x, y }) => `${x}: ${y}` ``` |
| <b>onHover</b>([<i>fn({x, y, points})</i>]) | Callback function for chart hover events. Gets triggered every time the mouse moves in/out of a different point hover area. Includes the point information as single argument, with `x`, `y` and `points` (list of all data points associated with the corresponding `x` value) data. If no point is in the `x` proximity of the mouse pointer, a value of `null` is returned instead. | - |
| <b>onClick</b>([<i>fn({x, y, points})</i>]) | Callback function for chart click events. Includes the currently hovered point information as single argument, with `x`, `y` and `points` (list of all data points associated with the corresponding `x` value) data. If no point is in the `x` proximity of the mouse pointer, a value of `null` is returned instead. | - |


[npm-img]: https://img.shields.io/npm/v/d3-horizon
[npm-url]: https://npmjs.org/package/d3-horizon
[build-size-img]: https://img.shields.io/bundlephobia/minzip/d3-horizon
[build-size-url]: https://bundlephobia.com/result?p=d3-horizon
[npm-downloads-img]: https://img.shields.io/npm/dt/d3-horizon
[npm-downloads-url]: https://www.npmtrends.com/d3-horizon

