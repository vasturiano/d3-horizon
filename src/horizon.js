import { select as d3Select } from 'd3-selection';
import 'd3-transition'; // extends d3-selection prototype
import { scaleLinear as d3ScaleLinear } from 'd3-scale';
import { area as d3Area, curveBasis as d3CurveBasis } from 'd3-shape';
import { range as d3Range } from 'd3-array';

import Kapsule from 'kapsule';
import accessorFn from 'accessor-fn';

export default Kapsule({
  props: {
    width: { default: window.innerWidth },
    height: { default: 40 },
    data: { default: [] },
    bands: { default: 4 },
    mode: { default: 'offset' }, // or mirror
    x: { default: d => d[0] },
    y: { default: d => d[1] },
    yExtent: {}, // undefined means it will derived dynamically from the data
    positiveColorRange: { default: ['white', 'midnightblue'] },
    negativeColorRange: { default: ['white', 'crimson'] },
    duration: { default: 0 }
  },

  stateInit() {
    return {
      area: d3Area().curve(d3CurveBasis),
      xScale: d3ScaleLinear(),
      yScale: d3ScaleLinear(),
      colorScale: d3ScaleLinear()
    }
  },

  init(el, state) {
    const isD3Selection = !!el && typeof el === 'object' && !!el.node && typeof el.node === 'function';
    const d3El = isD3Selection ? el : d3Select(el);
    d3El.html(null); // Wipe DOM

    state.svg = d3El.append('svg');
    state.svg.style('display', 'block');

    // unique id for clippaths
    const clipPathId = `d3_horizon_clip_${Math.round(Math.random() * 1e12)}`;

    // The clip path is a simple rect
    state.clipPathRect = state.svg.append('defs')
      .append('clipPath')
      .attr('id', clipPathId)
      .append('rect');

    // We'll use a container to clip all horizon layers at once
    state.horizonChart = state.svg.append('g')
      .attr('clip-path', `url(#${clipPathId})`);
  },

  update(state) {
    // Compute x- and y-values along with extents.
    const xAccessor = accessorFn(state.x);
    const yAccessor = accessorFn(state.y);
    const horizonData = state.data.map(d => [xAccessor(d), yAccessor(d)]);
    const xMin = Math.min(...horizonData.map(d => d[0]));
    const xMax = Math.max(...horizonData.map(d => d[0]));
    const yMax = Math.max(...horizonData.map(d => Math.abs(d[1])));

    // Compute the new x- and y-scales, and transform.
    state.xScale.domain([xMin, xMax]).range([0, state.width]);
    state.yScale.domain([0, state.yExtent || yMax]).range([0, state.height * state.bands]);
    const horizonTransform = d3HorizonTransform(state.bands, state.height, state.mode);

    // Set fill colors
    state.colorScale
      .domain([-state.bands, 0, 0, state.bands])
      .range([
        ...state.negativeColorRange.slice(0, 2).reverse(),
        ...state.positiveColorRange.slice(0, 2)
      ]);

    // Adjust svg dimensions
    state.svg.transition().duration(state.duration)
      .attr('width', state.width)
      .attr('height', state.height);

    // Adjust clipPath dimensions
    state.clipPathRect.transition().duration(state.duration)
      .attr('width', state.width)
      .attr('height', state.height);

    // Instantiate each copy of the path with different transforms.
    const path = state.horizonChart.selectAll('path')
      .data(d3Range(-1, -state.bands - 1, -1).concat(d3Range(1, state.bands + 1)), Number);

    const y0 = state.height * state.bands;

    const d0 = state.area
      .x(d => state.xScale(d[0]))
      .y0(y0)
      .y1(y0)
      (horizonData);

    const d1 = state.area
      .y1(d => state.height * state.bands - state.yScale(d[1]))
      (horizonData);

    path.exit()
      .transition().duration(state.duration)
      .attr('transform', horizonTransform)
      .remove();

    const newPath = path.enter()
      .append('path')
        .style('fill', state.colorScale)
        .attr('transform', horizonTransform)
        .attr('d', d0);

    path.merge(newPath)
      .transition().duration(state.duration)
        .style('fill', state.colorScale)
        .attr('transform', horizonTransform)
        .attr('d', d1);
  }
});

function d3HorizonTransform(bands, h, mode) {
  return mode === 'offset'
    ? d => `translate(0,${(d + (d < 0) - bands) * h})`
    : d => `${d < 0 ? 'scale(1,-1)' : ''} translate(0,${(d - bands) * h})`;
}
