# d3.horizon

[![NPM](https://nodei.co/npm/d3-horizon.png?compact=true)](https://nodei.co/npm/d3-horizon/)

A D3 based component that renders a [Horizon type area chart](https://hci.stanford.edu/publications/2009/heer-horizon-chi09.pdf).

Heavily based in previous work by [Mike Bostock](https://github.com/mbostock)'s [d3-horizon plugin], migrated for `D3 v4+` compatibility.

![Horizon Chart](http://vis.berkeley.edu/papers/horizon/construction.png)

## Quick start

```
import d3 from 'd3-horizon';
```
or
```
d3.horizon = require('d3-horizon');
```
or even
```
<script src="//unpkg.com/d3-horizon"></script>
```
then
```
d3.horizon()
    .data(<myData>)
    (<domNode>);
```

## API reference

| Method | Description | Default |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |:-------------:|
| <b>width</b>([<i>px</i>]) | Getter/setter for the chart width. | *&lt;window width&gt;* |
| <b>height</b>([<i>px</i>]) | Getter/setter for the chart height. | `40` |
| <b>data</b>([<i>array</i>]) | Getter/setter for chart data, as an array of data points. The syntax of each item is defined by the `x` and `y` accessor methods. | `[]` |
| <b>x</b>([<i>fn</i> or <i>str</i>]) | Getter/setter for the data point accessor function to extract the `x` axis values. A `function` receives the data point as input and should return a number. A string indicates the object attribute to use. | `d => d[0]` |
| <b>y</b>([<i>fn</i> or <i>str</i>]) | Getter/setter for the data point accessor function to extract the `y` axis values. A `function` receives the data point as input and should return a number. A string indicates the object attribute to use. | `d => d[1]` |
| <b>yExtent</b>([<i>number</i>]) | Getter/setter for the y axis maximum absolute value. By default (`undefined`), the max Y is calculated dynamically from the data. | `undefined` |
| <b>bands</b>([<i>int</i>]) | Getter/setter for the number of horizon bands to use. | `4` |
| <b>mode</b>([<i>'offset'</i> or <i>'mirror'</i>]) | Getter/setter for the mode used to represent negative values. `offset` renders the negative values from the top of the chart downwards, while `mirror` represents them upwards as if they were positive values, albeit with a different color. | `offset` |
| <b>positiveColorRange</b>([<i>[<minColor>, <maxColor>]</i>]) | Getter/setter for the color range to use for the positive value bands. The top band gets assigned the max color, and the other bands are colored according to a linear interpolation of the color range. | `['white', 'midnightBlue']` |
| <b>negativeColorRange</b>([<i>[<minColor>, <maxColor>]</i>]) | Getter/setter for the color range to use for the negative value bands. The top band gets assigned the max color, and the other bands are colored according to a linear interpolation of the color range. | `['white', 'crimson']` |
| <b>duration</b>([<i>ms</i>]) | Getter/setter for the duration (in milliseconds) of the transitions between states. | `0` |
